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

/**
 * resource type
 * @constant
 * @type Object
 */
cc.RESOURCE_TYPE = {
    "IMAGE": ["png", "jpg", "bmp", "jpeg", "gif"],
    "SOUND": ["mp3", "ogg", "wav", "mp4", "m4a"],
    "XML": ["plist", "xml", "fnt", "tmx", "tsx"],
    "BINARY": ["ccbi"],
    "FONT": "FONT",
    "TEXT": ["txt", "vsh", "fsh", "json", "ExportJson"],
    "UNKNOW": []
};

/**
 * resource structure
 * @param resList
 * @param selector
 * @param target
 * @constructor
 */
cc.ResData = function (resList, selector, target) {
    this.resList = resList || [];
    this.selector = selector;
    this.target = target;
    this.curNumber = 0;
    this.loadedNumber = 0;
    this.totalNumber = this.resList.length;
};

/**
 * A class to preload resources async
 * @class
 * @extends cc.Class
 */
cc.Loader = cc.Class.extend(/** @lends cc.Loader# */{
    _curData: null,
    _resQueue: null,
    _isAsync: false,
    _scheduler: null,
    _running: false,
    _regisiterLoader: false,

    /**
     * Constructor
     */
    ctor: function () {
        this._scheduler = cc.Director.getInstance().getScheduler();
        this._resQueue = [];
    },

    /**
     * init with resources
     * @param {Array} resources
     * @param {Function|String} selector
     * @param {Object} target
     */
    initWithResources: function (resources, selector, target) {
        if (!resources) {
            cc.log("cocos2d:resources should not null");
            return;
        }
        var res = resources.concat([]);
        var data = new cc.ResData(res, selector, target);
        this._resQueue.push(data);

        if (!this._running) {
            this._running = true;
            this._curData = this._resQueue.shift();
            this._scheduler.scheduleUpdateForTarget(this);
        }
    },

    setAsync: function (isAsync) {
        this._isAsync = isAsync;
    },

    /**
     * Callback when a resource file loaded.
     */
    onResLoaded: function (err) {
        if(err != null){
            cc.log("cocos2d:Failed loading resource: " + err);
        }

        this._curData.loadedNumber++;
    },

    /**
     * Get loading percentage
     * @return {Number}
     * @example
     * //example
     * cc.log(cc.Loader.getInstance().getPercentage() + "%");
     */
    getPercentage: function () {
        var percent = 0, curData = this._curData;
        if (curData.totalNumber == 0) {
            percent = 100;
        }
        else {
            percent = (0 | (curData.loadedNumber / curData.totalNumber * 100));
        }
        return percent;
    },

    /**
     * release resources from a list
     * @param resources
     */
    releaseResources: function (resources) {
        if (resources && resources.length > 0) {
            var sharedTextureCache = cc.TextureCache.getInstance(),
                sharedEngine = cc.AudioEngine ? cc.AudioEngine.getInstance() : null,
                sharedParser = cc.SAXParser.getInstance(),
                sharedFileUtils = cc.FileUtils.getInstance();

            var resInfo, path, type;
            for (var i = 0; i < resources.length; i++) {
                resInfo = resources[i];
                path = typeof resInfo == "string" ? resInfo : resInfo.src;
                type = this._getResType(resInfo, path);

                switch (type) {
                    case "IMAGE":
                        sharedTextureCache.removeTextureForKey(path);
                        break;
                    case "SOUND":
                        if (!sharedEngine) throw "Can not find AudioEngine! Install it, please.";
                        sharedEngine.unloadEffect(path);
                        break;
                    case "XML":
                        sharedParser.unloadPlist(path);
                        break;
                    case "BINARY":
                        sharedFileUtils.unloadBinaryFileData(path);
                        break;
                    case "TEXT":
                        sharedFileUtils.unloadTextFileData(path);
                        break;
                    case "FONT":
                        this._unregisterFaceFont(resInfo);
                        break;
                    default:
                        throw "cocos2d:unknown filename extension: " + type;
                        break;
                }
            }
        }
    },

    update: function () {
        if (this._isAsync) {
            var frameRate = cc.Director.getInstance()._frameRate;
            if (frameRate != null && frameRate < 20) {
                cc.log("cocos2d: frame rate less than 20 fps, skip frame.");
                return;
            }
        }

        var curData = this._curData;
        if (curData && curData.curNumber < curData.totalNumber) {
            this._loadRes();
            curData.curNumber++;
        }

        var percent = this.getPercentage();
        if(percent >= 100){
            this._complete();
            if (this._resQueue.length > 0) {
                this._running = true;
                this._curData = this._resQueue.shift();
            }
            else{
                this._running = false;
                this._scheduler.unscheduleUpdateForTarget(this);
            }
        }
    },

    _loadRes: function () {
        var sharedTextureCache = cc.TextureCache.getInstance(),
            sharedEngine = cc.AudioEngine ? cc.AudioEngine.getInstance() : null,
            sharedParser = cc.SAXParser.getInstance(),
            sharedFileUtils = cc.FileUtils.getInstance();

        var resInfo = this._curData.resList.shift(),
            path = this._getResPath(resInfo),
            type = this._getResType(resInfo, path);

        switch (type) {
            case "IMAGE":
                sharedTextureCache.addImageAsync(path, this.onResLoaded, this);
                break;
            case "SOUND":
                if (!sharedEngine) throw "Can not find AudioEngine! Install it, please.";
                sharedEngine.preloadSound(path, this.onResLoaded, this);
                break;
            case "XML":
                sharedParser.preloadPlist(path, this.onResLoaded, this);
                break;
            case "BINARY":
                sharedFileUtils.preloadBinaryFileData(path, this.onResLoaded, this);
                break;
            case "TEXT" :
                sharedFileUtils.preloadTextFileData(path, this.onResLoaded, this);
                break;
            case "FONT":
                this._registerFaceFont(resInfo, this.onResLoaded, this);
                break;
            default:
                throw "cocos2d:unknown filename extension: " + type;
                break;
        }
    },

    _getResPath: function (resInfo) {
        return typeof resInfo == "string" ? resInfo : resInfo.src;
    },

    _getResType: function (resInfo, path) {
        var isFont = resInfo.fontName;
        if (isFont != null) {
            return cc.RESOURCE_TYPE["FONT"];
        }
        else {
            var ext = path.substring(path.lastIndexOf(".") + 1, path.length);
            var index = ext.indexOf("?");
            if (index > 0) ext = ext.substring(0, index);

            for (var resType in cc.RESOURCE_TYPE) {
                if (cc.RESOURCE_TYPE[resType].indexOf(ext) != -1) {
                    return resType;
                }
            }
            return ext;
        }
    },

    _complete: function () {
        cc.doCallback(this._curData.selector,this._curData.target);
    },

    _registerFaceFont: function (fontRes,seletor,target) {
        var srcArr = fontRes.src;
        var fileUtils = cc.FileUtils.getInstance();
        if (srcArr && srcArr.length > 0) {
            var fontStyle = document.createElement("style");
            fontStyle.type = "text/css";
            document.body.appendChild(fontStyle);

            var fontStr = "@font-face { font-family:" + fontRes.fontName + "; src:";
            for (var i = 0; i < srcArr.length; i++) {
                fontStr += "url('" + fileUtils.fullPathForFilename(encodeURI(srcArr[i].src)) + "') format('" + srcArr[i].type + "')";
                fontStr += (i == (srcArr.length - 1)) ? ";" : ",";
            }
            fontStyle.textContent += fontStr + "};";

            //preload
            //<div style="font-family: PressStart;">.</div>
            var preloadDiv = document.createElement("div");
            preloadDiv.style.fontFamily = fontRes.fontName;
            preloadDiv.innerHTML = ".";
            preloadDiv.style.position = "absolute";
            preloadDiv.style.left = "-100px";
            preloadDiv.style.top = "-100px";
            document.body.appendChild(preloadDiv);
        }
        cc.doCallback(seletor,target);
    },

    _unregisterFaceFont: function (fontRes) {
        //todo remove style
    }
});

/**
 * Preload resources in the background
 * @param {Array} resources
 * @param {Function|String} selector
 * @param {Object} target
 * @return {cc.Loader}
 * @example
 * //example
 * var g_mainmenu = [
 *    {src:"res/hello.png"},
 *    {src:"res/hello.plist"},
 *
 *    {src:"res/logo.png"},
 *    {src:"res/btn.png"},
 *
 *    {src:"res/boom.mp3"},
 * ]
 *
 * var g_level = [
 *    {src:"res/level01.png"},
 *    {src:"res/level02.png"},
 *    {src:"res/level03.png"}
 * ]
 *
 * //load a list of resources
 * cc.Loader.preload(g_mainmenu, this.startGame, this);
 *
 * //load multi lists of resources
 * cc.Loader.preload([g_mainmenu,g_level], this.startGame, this);
 */
cc.Loader.preload = function (resources, selector, target) {
    if (!this._instance) {
        this._instance = new cc.Loader();
    }
    this._instance.initWithResources(resources, selector, target);
    return this._instance;
};

/**
 * Preload resources async
 * @param {Array} resources
 * @param {Function|String} selector
 * @param {Object} target
 * @return {cc.Loader}
 */
cc.Loader.preloadAsync = function (resources, selector, target) {
    if (!this._instance) {
        this._instance = new cc.Loader();
    }
    this._instance.setAsync(true);
    this._instance.initWithResources(resources, selector, target);
    return this._instance;
};

/**
 * Release the resources from a list
 * @param {Array} resources
 */
cc.Loader.purgeCachedData = function (resources) {
    if (this._instance) {
        this._instance.releaseResources(resources);
    }
};

/**
 * Returns a shared instance of the loader
 * @function
 * @return {cc.Loader}
 */
cc.Loader.getInstance = function () {
    if (!this._instance) {
        this._instance = new cc.Loader();
    }
    return this._instance;
};

cc.Loader._instance = null;


/**
 * Used to display the loading screen
 * @class
 * @extends cc.Scene
 */
cc.LoaderScene = cc.Scene.extend(/** @lends cc.LoaderScene# */{
    _logo: null,
    _logoTexture: null,
    _texture2d: null,
    _bgLayer: null,
    _label: null,
    _winSize: null,

    /**
     * Constructor
     */
    ctor: function () {
        cc.Scene.prototype.ctor.call(this);
        this._winSize = cc.Director.getInstance().getWinSize();
    },
    init: function () {
        cc.Scene.prototype.init.call(this);

        //logo
        var logoWidth = this._winSize.width;
        var logoHeight = this._winSize.height;
        var centerPos = cc.p(this._winSize.width / 2, this._winSize.height / 2);

        this._logoTexture = new Image();
        var _this = this, handler;
        this._logoTexture.addEventListener("load", handler = function () {
            _this._initStage(centerPos);
            this.removeEventListener('load', handler, false);
        });
        this._logoTexture.src = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4QBYRXhpZgAATU0AKgAAAAgAAgESAAMAAAABAAEAAIdpAAQA"+
            "AAABAAAAJgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAABuKADAAQAAAABAAACUgAAAAD/2wBD"+
            "AAoHCAkIBwoJCQkMCwoMEBoREA4OECAXGBMaJiEoJyUhJSQqLzwzKi05LSQlNEg1OT5AREREKTNK"+
            "T0lCTzxCREH/2wBDAQsMDBAOEB8RER9BKyUrQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFB"+
            "QUFBQUFBQUFBQUFBQUFBQUFBQUH/wAARCAJSAbgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAA"+
            "AAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKB"+
            "kaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZn"+
            "aGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT"+
            "1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcI"+
            "CQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAV"+
            "YnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6"+
            "goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk"+
            "5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDyY88Uw0p96bXUYIT604GkNHegY8HtTgxFRUua"+
            "BWJg/vTS2feoyaTdQHKOJpDSZooGKOtOAzSDkCpUUGgTECn1pwHFSAdM0MMDtn1pXII268VET709"+
            "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";
        this._logoTexture.width = logoWidth;
        this._logoTexture.height = logoHeight;

        // bg
        this._bgLayer = cc.LayerColor.create(cc.c4(32, 32, 32, 255));
        this._bgLayer.setPosition(0, 0);
        this.addChild(this._bgLayer, 0);

        //loading percent
        this._label = cc.LabelTTF.create("Loading... 0%", "Arial", 14);
        this._label.setColor(cc.c3(180, 180, 180));
        this._label.setPosition(cc.pAdd(centerPos, cc.p(0, -logoHeight / 2 - 10)));
        this._bgLayer.addChild(this._label, 10);
    },

    _initStage: function (centerPos) {
        this._texture2d = new cc.Texture2D();
        this._texture2d.initWithElement(this._logoTexture);
        this._texture2d.handleLoadedTexture();
        this._logo = cc.Sprite.createWithTexture(this._texture2d);
        this._logo.setScale(cc.CONTENT_SCALE_FACTOR());
        this._logo.setPosition(centerPos);
        this._bgLayer.addChild(this._logo, 10);
    },

    onEnter: function () {
        cc.Node.prototype.onEnter.call(this);
        this.schedule(this._startLoading, 0.3);
    },

    onExit: function () {
        cc.Node.prototype.onExit.call(this);
        var tmpStr = "Loading... 0%";
        this._label.setString(tmpStr);
    },

    /**
     * init with resources
     * @param {Array} resources
     * @param {Function|String} selector
     * @param {Object} target
     */
    initWithResources: function (resources, selector, target) {
        this.resources = resources;
        this.selector = selector;
        this.target = target;
    },

    _startLoading: function () {
        this.unschedule(this._startLoading);
        cc.Loader.preload(this.resources, this.selector, this.target);
        this.schedule(this._updatePercent);
    },

    _updatePercent: function () {
        var percent = cc.Loader.getInstance().getPercentage();
        var tmpStr = "Loading... " + percent + "%";
        this._label.setString(tmpStr);

        if (percent >= 100)
            this.unschedule(this._updatePercent);
    }
});

/**
 * Preload multi scene resources.
 * @param {Array} resources
 * @param {Function|String} selector
 * @param {Object} target
 * @return {cc.LoaderScene}
 * @example
 * //example
 * var g_mainmenu = [
 *    {src:"res/hello.png"},
 *    {src:"res/hello.plist"},
 *
 *    {src:"res/logo.png"},
 *    {src:"res/btn.png"},
 *
 *    {src:"res/boom.mp3"},
 * ]
 *
 * var g_level = [
 *    {src:"res/level01.png"},
 *    {src:"res/level02.png"},
 *    {src:"res/level03.png"}
 * ]
 *
 * //load a list of resources
 * cc.LoaderScene.preload(g_mainmenu, this.startGame, this);
 *
 * //load multi lists of resources
 * cc.LoaderScene.preload([g_mainmenu,g_level], this.startGame, this);
 */
cc.LoaderScene.preload = function (resources, selector, target) {
    if (!this._instance) {
        this._instance = new cc.LoaderScene();
        this._instance.init();
    }

    this._instance.initWithResources(resources, selector, target);

    var director = cc.Director.getInstance();
    if (director.getRunningScene()) {
        director.replaceScene(this._instance);
    } else {
        director.runWithScene(this._instance);
    }

    return this._instance;
};
