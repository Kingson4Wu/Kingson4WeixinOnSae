/****************************************************************************
 Copyright (c) 2010-2012 cocos2d-x.org
 Copyright (c) 2008-2010 Ricardo Quesada
 Copyright (c) 2011      Zynga Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

var MyLayer = cc.LayerColor.extend({

    torres1:null,
    torres2:null,

    init:function () {
        // 1. super init first
        // 必须调用父类init()方法，很多bug都是由于没有调用父类init()方法造成的
        this._super();
        // 设置Layer的背景
        this.setColor(cc.c4(135, 206, 255, 0.5));

        // 获得游戏可视的尺寸
        var winSize = cc.Director.getInstance().getWinSize();
        // 获取屏幕坐标原点
        var origin = cc.Director.getInstance().getVisibleOrigin();


        this.torres1 = cc.Sprite.create(s_Torres1,cc.rect(0,0,300,300));
        this.torres1.setPosition(cc.p( winSize.width/2 , winSize.height/2));
        this.addChild(this.torres1,1);

        this.torres2 = cc.Sprite.create(s_Torres2,cc.rect(30,30,300,300));
        this.torres2.setPosition(cc.p( winSize.width/2 , winSize.height/2));
        this.addChild(this.torres2,2);

        // 将层设置为可触摸
        this.setTouchEnabled(true);

        return true;
    },

    onTouchesMoved:function(touches,event){
        var touch = touches[0];
        var location = touch.getLocation();
        if(this.onClickFlag){
            this.torres1.setPosition(location);
        }
    },

    onTouchesEnded:function(touches, event){
        this.onClickFlag = false;
    },

    onTouchesBegan:function(touches,event){
        var touch = touches[0];
        var location = touch.getLocation();
        if(cc.rectContainsPoint(this.torres1.getBoundingBox(),location)){
            this.onClickFlag = true;
        }
    }
});

var MyScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new MyLayer();
        this.addChild(layer);
        layer.init();
    }
});


