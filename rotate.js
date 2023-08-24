"use strict";

let vm = new Vue({
    el: '#app',
    data: {
        rotate: 0,
        transSync: true,
        trans1x: 0, trans1y: 0,
        trans2x: 0, trans2y: 0,
    },
    methods: {
        onClickReset: function() {
            this._reset();
        },
        onInput: function() {
            this._drawCanvas();
        },
        onChange: function() {
            this._drawCanvas();
        },
        onInputTrans1: function() {
            if (this.transSync) {
                this.trans2x = this.trans1x;
                this.trans2y = this.trans1y;
            }
            this._drawCanvas();
        },
        onInputTrans2: function() {
            if (this.transSync) {
                this.trans1x = this.trans2x;
                this.trans1y = this.trans2y;
            }
            this._drawCanvas();
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
            let {rotate, trans1x, trans1y, trans2x, trans2y} = this;
            const canvas = document.getElementById("canvas");
            const ctx = canvas.getContext("2d");
            const {width, height} = canvas;
            canvas.width = width;
            rotate = parseInt(rotate, 10) * Math.PI/180;
            trans1x = parseInt(trans1x, 10) * width / 100;
            trans1y = parseInt(trans1y, 10) * height / 100;
            trans2x = parseInt(trans2x, 10) * width / 100;
            trans2y = parseInt(trans2y, 10) * height / 100;
            ctx.translate(trans1x, trans1y);
//            ctx.arc(0, 0, 5, 0, 2*Math.PI);
//            ctx.stroke();
            ctx.rotate(rotate);
            ctx.translate(-trans2x, -trans2y);
            ctx.font = "64px serif";
            ctx.strokeText("ABC...", trans1x, trans1y);
        }
    },
    mounted : function() {
        this._reset();
        this._drawCanvas();
    },
})
