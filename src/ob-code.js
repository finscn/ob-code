"use strict";

var esprima = require("esprima"),
    escodegen = require("escodegen");

(function(exports) {

    if (typeof require !== "function") {
        require = function() {};
    }

    var base = require("./base") || this,
        Reserved = require("./reserved"),
        util = base.util;

    var Syntax = {
        Anonymous: "(Anonymous)"
    };

    for (var key in esprima.Syntax) {
        Syntax[key] = esprima.Syntax[key];
    }



    var Config = Object.create(null);


    var Hanlder = {

        VariableDeclaration: function(node) {
            var self = this;
            var declarations = node.declarations;
            declarations.forEach(function(d) {
                if (d.type == Syntax.VariableDeclarator) {
                    var name = d.id.name;
                    self.variables[name] = self.variables[name] || [];
                    self.variables[name].push(d.id)
                }
            })
        },

        FunctionDeclaration: function(node) {
            var self = this;

            var name = node.id ? node.id.name : Syntax.Anonymous;
            var functionScope = new FunctionScope(node, self);
            var d = self.functions[functionScope.name] || [];
            if (node.id) {
                d.push(node.id);
            }
            self.functions[functionScope.name] = d;
        },

        FunctionExpression: function(node) {
            var self = this;
            return Hanlder.FunctionDeclaration.call(self, node);
        },

        Identifier: function(node, key, parentNode) {
            var self = this;
            var name = node.name;

            if (node._ignore_) {
                return true;
            }

            var paramMap = self.parameters,
                varMap = self.variables,
                funMap = self.functions;

            var found = false;

            if (key == "property" && !parentNode.computed) {
                if (node.type == Syntax.Literal) {
                    // Hanlder._addProperty(node.value, node);
                    Hanlder._addProperty(node.raw, node, "property");
                } else {
                    Hanlder._addProperty(node.name, node, "property");
                }
                return false;
            }

            if (varMap && Array.isArray(varMap[name])) {
                found = true;
                varMap[name].push(node);
            }
            if (funMap && Array.isArray(funMap[name])) {
                found = true;
                funMap[name].push(node);
            }
            if (paramMap && Array.isArray(paramMap[name])) {
                found = true;
                paramMap[name].push(node);
            }

            if (!found && node.type == Syntax.Identifier) {
                self.undefinedIdentifier.push(node);
            }
            return found;
        },



        MemberExpression: function(node) {
            var self = this;
            var property = node.property;
            var computed = node.computed;
            if (computed) { // obj[key]
                if (property.type == Syntax.Literal) {
                    // Hanlder._addProperty(property.value, property);
                    Hanlder._addProperty(property.raw, property, "MemberExpression");
                }
            } else { // obj.key
                if (property.type == Syntax.Identifier) {
                    property.nodeType = "MemberExpression";
                    Hanlder._addProperty(property.name, property, "MemberExpression");
                }
            }
        },


        // ObjectExpression : function(node){

        // },
        //
        // EmptyStatement : function(node){

        // },

        Property: function(node, computed) {
            var self = this;
            var property = node.key;
            if (property.type == Syntax.Literal) {
                // Hanlder._addProperty(property.value, property);
                Hanlder._addProperty(property.raw, property, "Property");
            } else if (property.type == Syntax.Identifier) {
                Hanlder._addProperty(property.name, property, "Property");
            }
        },


        CatchClause: function(node) {
            var self = this;
            var catchScope = new CatchScope(node, self);
        },


        _addProperty: function(nodeKey, property, nodeType) {
            if (typeof nodeKey == "string") {
                if (!Array.isArray(Properties[nodeKey])) {
                    Properties[nodeKey] = [];
                }
                property.nodeKey = nodeKey;
                var list = Properties[nodeKey];
                nodeType && (property.nodeType = nodeType);
                list.push(property)
            }
        }


    };

    var Properties = Object.create(null);
    var StringLiteral = Object.create(null);

    var ScopePathMap = Object.create(null);

    function BaseScope(node, parent) {}

    BaseScope.prototype = {
        constructor: BaseScope,


        init: function() {
            this.variables = Object.create(null);
            this.functions = Object.create(null);

            this.usedIdentifier = Object.create(null);
            this.undefinedIdentifier = [];

            this.childScopes = [];

        },

        build: function(node) {

            this.findDeclaration(node.body);

            this.parseNode(node.body);

            var self = this;
            this.usedIdentifier[self.name] = self.name;
            for (var key in this.variables) {
                this.usedIdentifier[key] = key;
            }
            for (var key in this.functions) {
                this.usedIdentifier[key] = key;
            }
            this.undefinedIdentifier.forEach(function(u) {
                self.usedIdentifier[u.name] = u.name;
            });


            this.childScopes.forEach(function(child) {
                if (child.type == Syntax.CatchClause) {
                    return;
                }
                var uList = child.undefinedIdentifier;
                uList.forEach(function(u, i) {
                    var rs = Hanlder.Identifier.call(self, u);
                    if (rs === false && self.type == Syntax.Program) {
                        self.variables[u.name] = [];
                        rs = true;
                    }
                    if (rs) {
                        var m = null;
                        if (Array.isArray(self.variables[u.name])) {
                            m = self.variables[u.name];
                        } else if (Array.isArray(self.functions[u.name])) {
                            m = self.functions[u.name];
                        } else if (Array.isArray(self.parameters[u.name])) {
                            m = self.parameters[u.name];
                        }
                        m.push(u);
                        uList[i] = null;
                    } else {
                        self.undefinedIdentifier.push(u);
                    }
                });
                child.undefinedIdentifier = [];
            });

        },


        isInCurrentScope: function(node) {
            return node.type != Syntax.FunctionDeclaration && node.type != Syntax.FunctionExpression && node.type != Syntax.CatchClause;
        },

        changeVarName: function(oldName, newName) {
            var list = this.variables[oldName];
            delete this.variables[oldName];
            if (list && !list._changed) {
                this.variables[newName] = list;

                list.forEach(function(v) {
                    v.name = newName;
                });
                list._changed = true;
                if (this.parameters && (oldName in this.parameters)) {
                    this.changeParamName(oldName, newName);
                }
            }
        },

        changeParamName: function(oldName, newName) {
            var list = this.parameters[oldName];
            delete this.parameters[oldName];
            if (list && !list._changed) {
                this.parameters[newName] = list;

                list.forEach(function(v) {
                    v.name = newName;
                });
                list._changed = true;
                if (this.variables && (oldName in this.variables)) {
                    this.changeVarName(oldName, newName);
                }
            }
        },

        changeFuncName: function(oldName, newName) {
            var list = this.functions[oldName];
            delete this.functions[oldName];
            if (list && !list._changed) {
                this.functions[newName] = list;

                list.forEach(function(v) {
                    v.name = newName;
                });
                list._changed = true;
                if (this.variables && (oldName in this.variables)) {
                    this.changeVarName(oldName, newName);
                }
            }
        },

        obfuscate: function(cache, blackOnly) {
            if (cache === true || cache === false) {
                blackOnly = cache;
                cache = null;
                console.log("==================================")
            }
            cache = cache || Object.create(null);
            this.obfuscateSelf(cache, blackOnly);
            this.obfuscateChildren(cache, blackOnly);
        },

        obfuscateSelf: function(cache, blackOnly) {
            if (cache === true || cache === false) {
                blackOnly = cache;
                cache = null;
                console.log("==================================")
            }
            cache = cache || Object.create(null);
            for (var key in this.usedIdentifier) {
                cache[key] = true;
            }
            for (var k in Config.varMapping) {
                cache[Config.varMapping[k]] = true;
            }

            var self = this;
            var varKeys = Object.keys(this.variables);
            var funcKeys = Object.keys(this.functions);
            var paramKeys = Object.keys(this.parameters || Object.create(null));

            var reserved = Object.create(null);

            if (blackOnly) {
                paramKeys.forEach(function(k) {
                    reserved[k] = true;
                });
                varKeys.forEach(function(k) {
                    reserved[k] = true;
                });
                funcKeys.forEach(function(k) {
                    reserved[k] = true;
                });
            }

            for (var p in Config.blackListV) {
                delete reserved[p];
            }
            for (var p in Config.blackList) {
                delete reserved[p];
            }

            for (var p in Reserved.keyword) {
                reserved[p] = true;
            }
            for (var p in Reserved.global) {
                reserved[p] = true;
            }
            for (var p in Reserved.node) {
                reserved[p] = true;
            }
            for (var p in Reserved.domClass) {
                reserved[p] = true;
            }
            for (var p in Config.reservedListV) {
                reserved[p] = true;
            }
            for (var p in Config.reservedList) {
                reserved[p] = true;
            }
            for (var p in Config.whiteListV) {
                reserved[p] = true;
            }
            for (var p in Config.whiteList) {
                reserved[p] = true;
            }


            var allKeys = [];
            paramKeys.forEach(function(k) {
                if (!reserved[k]) {
                    allKeys.push({
                        key: k,
                        type: "parameters"
                    });
                }
            });
            varKeys.forEach(function(k) {
                if (!reserved[k]) {
                    allKeys.push({
                        key: k,
                        type: "variables"
                    });
                }
            });
            funcKeys.forEach(function(k) {
                if (!reserved[k] && k.indexOf("(") != 0) {
                    allKeys.push({
                        key: k,
                        type: "functions"
                    });
                }
            });

            // allKeys.sort(function(a, b) {
            //     var _a = self[a.type][a.key].length;
            //     var _b = self[b.type][b.key].length;
            //     return _b - _a;
            // });

            allKeys.forEach(function(a, idx) {
                var k = a.key;
                reserved[k] = true;
            });

            for (var k in GlobalMapping) {
                var n = GlobalMapping[k];
                cache[n] = true;
            }

            var newNames = util.getRandomNames(allKeys.length, cache, reserved);

            allKeys.forEach(function(a, idx) {
                var k = a.key;
                var n = Config.varMapping[k];
                n = n || newNames[idx];

                var type = a.type;
                if (!VarMapping[n]) {
                    VarMapping[n] = [];
                }
                VarMapping[n].push(k);
                if (type == "variables") {
                    self.changeVarName(k, n);
                } else if (type == "functions") {
                    self.changeFuncName(k, n);
                } else if (type == "parameters") {
                    self.changeParamName(k, n);
                }
                if (self.isGlobal) {
                    GlobalMapping[k] = n;
                }
            });
        },

        obfuscateChildren: function(cache, blackOnly) {
            this.childScopes.forEach(function(child) {
                var _cache = Object.create(null);
                if (cache && cache !== true) {
                    util.merger(_cache, cache);
                }
                child.obfuscate(_cache, blackOnly);
            });
        },

        findDeclaration: function(node) {
            var self = this;
            if (Array.isArray(node)) {
                for (var i = 0, len = node.length; i < len; i++) {
                    var _node = node[i];
                    self.findDeclaration(_node);
                }
            } else if (util.isObject(node)) {
                if (node.type == Syntax.VariableDeclaration || node.type == Syntax.FunctionDeclaration) {
                    Hanlder[node.type].call(self, node, self);
                }
                if (this.isInCurrentScope(node)) {
                    for (var key in node) {
                        if (node.type == Syntax.Property && key == "key") {
                            continue;
                        }
                        self.findDeclaration(node[key]);
                    }
                }
            }
        },

        parseNode: function(node, key, parentNode) {
            var self = this;
            if (Array.isArray(node)) {
                for (var i = 0, len = node.length; i < len; i++) {
                    var _node = node[i];
                    if (_node.type == Syntax.EmptyStatement) {
                        node.splice(i, 1);
                        i--;
                        len--;
                        continue;
                    }
                    self.parseNode(_node, i, node);
                }
            } else if (util.isObject(node)) {
                if (node.type != Syntax.VariableDeclaration && node.type != Syntax.FunctionDeclaration) {
                    var handler = Hanlder[node.type];
                    if (handler) {
                        handler.call(self, node, key, parentNode);
                    }
                }
                if (this.isInCurrentScope(node)) {
                    for (var _key in node) {
                        if (node.type == Syntax.Property && _key == "key") {
                            continue;
                        }
                        self.parseNode(node[_key], _key, node);
                    }
                }

            }
        }
    }

    var VarMapping = Object.create(null);
    var PropertyMapping = Object.create(null);
    var StringMapping = Object.create(null);
    var GlobalMapping = Object.create(null);

    function GlobalScope(node, config) {

        this.name = "/";
        this.type = node.type || Syntax.Program;

        this.path = "/";

        util.merger(Config, config);

        this.init();

        this.build(node);

        var self = this;
        var uList = this.undefinedIdentifier;
        uList.forEach(function(u, i) {
            self.variables[u.name] = self.variables[u.name] || [];
            self.variables[u.name].push(u);
        });
        this.undefinedIdentifier = [];
    }

    util.merger(GlobalScope.prototype, BaseScope.prototype);

    util.merger(GlobalScope.prototype, {

        constructor: GlobalScope,

        isGlobal: true,

        findStringLiteral: function(node, literals) {
            literals = literals || Object.create(null);
            if (Array.isArray(node)) {
                for (var i = 0, len = node.length; i < len; i++) {
                    this.findStringLiteral(node[i], literals);
                }
            } else if (util.isObject(node)) {
                if (node.type == Syntax.Literal && typeof node.value == "string") {
                    var value = node.value;
                    literals[value] = literals[value] || [];
                    literals[value].push(node);
                }
                for (var key in node) {
                    this.findStringLiteral(node[key], literals);
                }
            }
            return literals;
        },

        obfuscateTop: function() {
            // TODO
            var variables = this.variables;
            for (var key in variables) {
                console.log(key, variables[key]);
            }
        },

        obfuscateString: function(strings) {
            // TODO
            var literalKeys = Object.keys(strings);
            var self = this;
            var cache = Object.create(null);
            var reserved = Object.create(null);

            var count = 0;
            var stringMapping = Object.create(null);
            for (var k in PropertyMapping) {
                stringMapping[PropertyMapping[k]] = k;
                count++;
            }
            var i = 0;
            literalKeys.forEach(function(k, idx) {
                if (stringMapping[k]) {
                    var newName = stringMapping[k];
                    StringMapping[newName] = k;
                    self.changeLiteralValue(strings, k, newName);
                }
            });
            return StringMapping;
        },

        obfuscateProperties: function(properties, blackOnly) {
            var properKeys = Object.keys(properties);
            var self = this;
            var count = properKeys.length;
            var cache = Object.create(null);

            for (var k in Config.propertyMapping) {
                cache[Config.propertyMapping[k]] = true;
            }

            var reservedProperties = Object.create(null);
            var reserved = Object.create(null);

            if (blackOnly) {
                properKeys.forEach(function(k) {
                    reserved[k] = true;
                });
            }

            for (var p in Config.blackListP) {
                delete reserved[p];
            }
            for (var p in Config.blackList) {
                delete reserved[p];
            }

            for (var p in Reserved.keyword) {
                reserved[p] = true;
            }
            for (var p in Reserved.global) {
                reserved[p] = true;
            }
            for (var p in Reserved.node) {
                reserved[p] = true;
            }
            for (var p in Reserved.property) {
                reserved[p] = true;
            }
            for (var p in Reserved.dom) {
                reserved[p] = true;
            }
            for (var p in Config.reservedListP) {
                reserved[p] = true;
            }
            for (var p in Config.reservedList) {
                reserved[p] = true;
            }
            for (var p in Config.whiteListP) {
                reserved[p] = true;
            }
            for (var p in Config.whiteList) {
                reserved[p] = true;
            }


            // properKeys.sort(function(a, b) {
            //     var _a = properties[a].length;
            //     var _b = properties[b].length;
            //     return _b - _a;
            // });

            var newNames = util.getRandomNames(count, cache, reserved);

            var i = 0;
            properKeys.forEach(function(k) {
                if (!reserved[k]) {
                    var n = Config.propertyMapping[k];
                    n = n || newNames[i];
                    PropertyMapping[n] = k;
                    self.changePropertyName(properties, k, n);
                    i++;
                } else {
                    reservedProperties[k] = properties[k];
                }
            });


            return reservedProperties;
        },

        getObfuscateVariables: function(variables, blackOnly) {
            var varKeys = Object.keys(variables);

            var reserved = Object.create(null);

            if (blackOnly) {
                varKeys.forEach(function(k) {
                    reserved[k] = true;
                });
            }
            for (var p in Config.blackListV) {
                delete reserved[p];
            }
            for (var p in Config.blackList) {
                delete reserved[p];
            }

            for (var p in Reserved.keyword) {
                reserved[p] = true;
            }
            for (var p in Reserved.global) {
                reserved[p] = true;
            }
            for (var p in Reserved.node) {
                reserved[p] = true;
            }
            for (var p in Reserved.domClass) {
                reserved[p] = true;
            }
            for (var p in Config.reservedListV) {
                reserved[p] = true;
            }
            for (var p in Config.reservedList) {
                reserved[p] = true;
            }
            for (var p in Config.whiteListV) {
                reserved[p] = true;
            }
            for (var p in Config.whiteList) {
                reserved[p] = true;
            }

            var variablesOut = [];
            varKeys.forEach(function(k) {
                if (!reserved[k]) {
                    var varInfo = variables[k][0];
                    variablesOut.push(varInfo)
                }
            });
            return variablesOut;
        },

        getObfuscateProperties: function(properties, blackOnly) {
            var properKeys = Object.keys(properties);
            var reserved = Object.create(null);

            if (blackOnly) {
                properKeys.forEach(function(k) {
                    reserved[k] = true;
                });
            }
            for (var p in Config.blackListP) {
                delete reserved[p];
            }
            for (var p in Config.blackList) {
                delete reserved[p];
            }

            for (var p in Reserved.keyword) {
                reserved[p] = true;
            }
            for (var p in Reserved.global) {
                reserved[p] = true;
            }
            for (var p in Reserved.node) {
                reserved[p] = true;
            }
            for (var p in Reserved.property) {
                reserved[p] = true;
            }
            for (var p in Reserved.dom) {
                reserved[p] = true;
            }
            for (var p in Config.reservedListP) {
                reserved[p] = true;
            }
            for (var p in Config.reservedList) {
                reserved[p] = true;
            }
            for (var p in Config.whiteListP) {
                reserved[p] = true;
            }
            for (var p in Config.whiteList) {
                reserved[p] = true;
            }

            var propertiesOut = [];
            properKeys.forEach(function(k) {
                if (!reserved[k]) {
                    var properInfo = properties[k][0];
                    propertiesOut.push(properInfo);
                }
            });

            return propertiesOut;
        },

        changePropertyName: function(properties, oldName, newName) {
            var list = properties[oldName];
            delete properties[oldName];
            if (list) {
                properties[newName] = list;
                list.forEach(function(v) {
                    v.name = newName;
                })
            }
        },

        changeLiteralValue: function(literals, oldValue, newValue) {
            var list = literals[oldValue];
            delete literals[oldValue];
            if (list) {
                literals[newValue] = list;
                list.forEach(function(v) {
                    v.value = newValue;
                })
            }
        },

    });

    function FunctionScope(node, parent) {

        var id = node.id;
        if (!id) {
            this.name = Syntax.Anonymous;
        } else {
            this.name = id.name;
        }

        this.init();

        if (parent) {
            this.index = parent.childScopes.length;
            parent.childScopes.push(this);
            if (this.name == Syntax.Anonymous) {
                this.name += this.index;
            }
            this.path = parent.path + "/" + this.name;

            ScopePathMap[this.path] = this;
        } else {
            this.path = "/";
        }
        // this.parent=parent||null;



        this.parameters = Object.create(null);
        if (node.params) {

            this.findParams(node.params);
        }

        this.build(node);


    }
    util.merger(FunctionScope.prototype, BaseScope.prototype);

    util.merger(FunctionScope.prototype, {

        constructor: FunctionScope,

        findParams: function(params) {
            for (var i = 0, len = params.length; i < len; i++) {
                var p = params[i];
                if (p.type == Syntax.Identifier) {
                    var name = p.name;
                    this.parameters[name] = [p];
                }
            }
        }

    });

    function CatchScope(node, parent) {


        this.type = node.type;

        this.paramName = node.param.name;
        node.param._ignore_ = true;

        this.init();

        this.variables[this.paramName] = [
            node.param
        ];

        this.findIdentifier(node.body);

        parent.childScopes.push(this);
        BaseScope.prototype.build.call(parent, node);

    }

    util.merger(CatchScope.prototype, BaseScope.prototype);

    util.merger(CatchScope.prototype, {

        constructor: CatchScope,

        findIdentifier: function(node) {
            var self = this;
            if (Array.isArray(node)) {
                for (var i = 0, len = node.length; i < len; i++) {
                    self.findIdentifier(node[i]);
                }
            } else if (util.isObject(node)) {

                if (node.type == Syntax.Identifier && node.name == self.paramName) {
                    var name = node.name;
                    var m = this.variables[name] = this.variables[name] || [];
                    m.push(node);
                    node._ignore_ = true;
                } else {
                    if (this.isInCurrentScope(node)) {
                        for (var key in node) {
                            if (node.type == Syntax.Property && key == "key") {
                                continue;
                            }
                            self.findIdentifier(node[key]);
                        }
                    }
                }

            }
        }

    });


    exports.Config = Config;
    exports.GlobalScope = GlobalScope;
    exports.FunctionScope = FunctionScope;
    exports.Properties = Properties;
    exports.ScopePathMap = ScopePathMap;
    exports.VarMapping = VarMapping;
    exports.PropertyMapping = PropertyMapping;
    exports.GlobalMapping = GlobalMapping;
    exports.StringMapping = StringMapping;

}(typeof exports === 'undefined' ? (GT = {}) : exports));
