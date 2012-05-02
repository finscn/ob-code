
;(function (exports) {

if (typeof require!=="function"){
    require=function(){};
}


var base=require("./base")||this,
    Syntax=base.Syntax,
    ReservedWords=base.ReservedWords,
    util= base.util;


var Hanlder={
    Identifier : function(node){
        var self=this;
        var name=node.name;

        var paramMap=self.parameters,
            varMap=self.variables,
            funMap=self.functions;

        var found=false;

        if (varMap&&Array.isArray(varMap[name]) ){
            found=true;
            varMap[name].push(node);
        }
        if (funMap&& Array.isArray(funMap[name]) ){
            found=true;
            funMap[name].push(node);
        }
        if (paramMap&&Array.isArray(paramMap[name]) ){
            found=true;
            paramMap[name].push(node);
        }

        if (!found && node.type==Syntax.Identifier){
            self.undefinedIdentifier.push(node);
        }
        return found;
    },

    VariableDeclaration : function(node){
        var self=this;
        var declarations=node.declarations;
        declarations.forEach( function(d){
            if (d.type==Syntax.VariableDeclarator){
                var name=d.id.name;
                self.variables[name]=[];
            }
        })
    },

   FunctionDeclaration : function(node){
        var self=this;

        var name=node.id?node.id.name:Syntax.Anonymous;
        var functionScope=new FunctionScope(node, self);
        self.functions[functionScope.name]=node.id?[node.id]:[];
    },

    FunctionExpression : function(node){
        var self=this;
        return Hanlder.FunctionDeclaration.call(self, node);
    },

    MemberExpression : function(node){
        var self=this;

        var property=node.property;
        var computed=node.computed;
        if (computed){ // obj[key]
            if (property.type== Syntax.Literal){
                Hanlder._addProperty(property.value, property);
           }          
        }else{ // obj.key
           if (property.type== Syntax.Identifier){
                Hanlder._addProperty(property.name, property);
           }
        }
    },


    // ObjectExpression : function(node){

    // },

    Property : function(node, computed){
        var self=this;
        var property=node.key;
        if (property.type== Syntax.Identifier){
            Hanlder._addProperty(property.name, property);
        }else if(property.type== Syntax.Literal){
            Hanlder._addProperty(property.value, property);
        }
    },

    // CatchClause : function(node){

    // },
    
    _addProperty : function(pname, property){
        if (typeof pname =="string"){
            if (!Array.isArray(Properties[pname])){
                Properties[pname]=[];                            
            }
            var list=Properties[pname];
            list.push(property)                         
        }
    }


};

var Properties=Object.create(null);
var ScopePathMap={};

function BaseScope(node, parent){ }

BaseScope.prototype={
    constructor : BaseScope,

    build : function(node){
        this.variables=Object.create(null);
        this.functions=Object.create(null);

        this.usedIdentifier=Object.create(null);
        this.undefinedIdentifier=[];

        this.childScopes=[];
        this.findDeclaration(node.body);

        var self=this;
        this.usedIdentifier[self.name]=self.name;
        for (var key in this.variables){
            this.usedIdentifier[key]=key;
        }
        for (var key in this.functions){
            this.usedIdentifier[key]=key;
        }
        this.undefinedIdentifier.forEach(function(u){
             self.usedIdentifier[u.name]=u.name;
        });
        
        this.childScopes.forEach(function(child){
            var uList=child.undefinedIdentifier;
            uList.forEach(function(u,i){
               var rs=Hanlder.Identifier.call(self, u);
               if(rs===false && self.type== Syntax.Program){
                    self.variables[u.name]=[];
                    rs=true;
               }
               if (rs){
                    var m=null;
                    if ( Array.isArray(self.variables[u.name]) ){
                        m=self.variables[u.name];
                    }else if( Array.isArray(self.functions[u.name]) ){
                        m=self.functions[u.name];
                    }else if( Array.isArray(self.parameters[u.name]) ){
                        m=self.parameters[u.name];
                    }
                    m.push(u);
                    uList[i]=null;
               }else{
                    self.undefinedIdentifier.push(u);
               }
            });
            child.undefinedIdentifier=[];
        });

    },
    obfuscateChildren : function(){
        this.childScopes.forEach(function(child){
            child.obfuscate();
        });
    },

    obfuscate : function(){
        var cache=Object.create(null);
        for (var key in this.usedIdentifier){
            cache[key]=true;
        }
        ReservedWords.forEach(function(r){
            cache[r]=true;
        })

        var self=this;
        var varKeys=Object.keys(this.variables);
        var funcKeys=Object.keys(this.functions);
        var paramKeys=Object.keys(this.parameters||{});
        

        var count=varKeys.length+funcKeys.length+paramKeys.length;

        var newNames=util.getRandomNames(count,cache);

        var i=0;
        varKeys.forEach(function(k){
            self.changeVarName(k, newNames[i++]);
        });
        funcKeys.forEach(function(k){
            self.changeFuncName(k, newNames[i++]);
        });
        paramKeys.forEach(function(k){
            self.changeParamName(k, newNames[i++]);
        });
        this.obfuscateChildren();

    },

    isInCurrentScope : function(node){
        return node.type!=Syntax.FunctionDeclaration
                && node.type!=Syntax.FunctionExpression
                && node.type!=Syntax.CatchClause ;
    },

    changeVarName : function(oldName, newName){
        var list=this.variables[oldName];
        delete this.variables[oldName];
        if (list){
            this.variables[newName]=list;

            list.forEach(function(v){
                v.name=newName;
            })
        }
        if (this.parameters && (oldName in this.parameters)){
            this.changeParamName(oldName, newName);
        }
    },

    changeParamName : function(oldName, newName){
        var list=this.parameters[oldName];
        delete this.parameters[oldName];
        if (list){
            this.parameters[newName]=list;

            list.forEach(function(v){
                v.name=newName;
            })
        }
    },
    changeFuncName : function(oldName, newName){
        var list=this.functions[oldName];
        delete this.functions[oldName];
        if (list){
            this.functions[newName]=list;

            list.forEach(function(v){
                v.name=newName;
            })
        }
        if (this.parameters && (oldName in this.parameters)){
            this.changeParamName(oldName, newName);
        }
    },

    findDeclaration : function(node){
        var self=this;
        if (Array.isArray(node)){
            for (var i=0,len=node.length;i<len;i++){
                self.findDeclaration(node[i]);
            }
        }else if (util.isObject(node)){
            var handler=Hanlder[node.type];
            if (handler){
                handler.call(self, node, self);
            }
            if ( this.isInCurrentScope(node) ){
                for (var key in node){
                    if (node.type==Syntax.Property && key=="key"){
                        continue;
                    }
                    self.findDeclaration( node[key] );                    
                }
            }else{

            }
        }
    }
}


function GlobalScope(node){

    this.name="/";
    this.type=node.type||Syntax.Program;

    this.path="/";

    this.build(node);

    var self=this;
    var uList=this.undefinedIdentifier;
    uList.forEach(function(u,i){
        self.variables[u.name]=self.variables[u.name]||[];
        self.variables[u.name].push(u);
    });
    this.undefinedIdentifier=[];
}

util.merger(GlobalScope.prototype, BaseScope.prototype);
util.merger(GlobalScope.prototype , {
    constructor : GlobalScope ,
    changePropertyName : function(oldName,newName){
            var list=this[oldName];
            delete this[oldName];
            if (list){
                this[newName]=list;
                list.forEach(function(v){
                    v.name=newName;
                })
            }
    }
});

function FunctionScope(node,parent){

    var id=node.id;
    if (!id){
        this.name=Syntax.Anonymous;
    }else{
        this.name=id.name; 
    }
   
    if (parent){
       this.index=parent.childScopes.length;
       parent.childScopes.push( this );
       if (this.name==Syntax.Anonymous){
            this.name+=this.index;
       }
       this.path=parent.path+"/"+this.name; 

       ScopePathMap[this.path]=this;
    }else{
        this.path="/";
    }
    // this.parent=parent||null;
    
    this.parameters=Object.create(null);
    if (node.params){

        this.findParams(node.params);
    }

    this.build(node);

}
util.merger(FunctionScope.prototype, BaseScope.prototype);

util.merger(FunctionScope.prototype , {

    constructor : FunctionScope ,

    findParams : function(params){
        for (var i=0,len=params.length;i<len;i++){
            var p=params[i];
            if (p.type==Syntax.Identifier){
                var name=p.name;
                this.parameters[name]=[p];
            }
        }
    }

});


exports.GlobalScope=GlobalScope;
exports.FunctionScope=FunctionScope;
exports.Properties=Properties;
exports.ScopePathMap=ScopePathMap;


}(typeof exports === 'undefined' ? (GT = {}) : exports));



