function initTouchController() {
    controller = new Toucher.Controller({
        beforeInit: function() {
            this.dom = window;
        },
        // pixelRatio: Config.touchPixelRatio,
        preventDefaultMove: true,
        moveInterval: 30
    });
    controller.init();
}