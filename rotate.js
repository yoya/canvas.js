"use strict";

let vm = new Vue({
    el: '#app',
    data: {
        trans1x: 0, trans1y: 0,
        rotate: 0,
        trans2x: 0, trans2y: 0,
    },
    methods: {
        onInput: function() {
            this._drawCanvas();
        },
        onClickReset: function() {
            this._reset();
        },
        //  user function
        _reset : function() {
            this.rotate;
            this.trans1x = 50;
            this.trans1y = 50;
            this.rotate = 0;
            this.trans2x = 50;
            this.trans2y = 50;
        },
        _drawCanvas : function() {
            let {trans1x, trans1y, rotate, trans2x, trans2y} = this;
            const canvas = document.getElementById("canvas");
            const ctx = canvas.getContext("2d");
            const {width, height} = canvas;
            canvas.width = width;
            trans1x = parseInt(trans1x, 10) * width / 100;
            trans1y =  parseInt(trans1y, 10) * height / 100;
            rotate = parseInt(rotate,  10) * Math.PI/180;
            trans2x = parseInt(trans2x,  10) * width / 100;
            trans2y = parseInt(trans2y, 10) * height / 100;

            ctx.translate(trans1x, trans1y);
            ctx.rotate(rotate);
            ctx.translate(-trans2x, -trans2y);
             ctx.font = "64px serif";
            ctx.strokeText("ABC...", trans1x, trans1y);
            console.log("trans1x, trans1y:", trans1x, trans1y, "rotate:", rotate,"trans2x, trans2y", trans2x, trans2y)
        }
    },
    created: function() {
        console.log("created");
    },
    mounted : function() {
        this._reset();
        this._drawCanvas();
    },
})
