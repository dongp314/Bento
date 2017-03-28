/**
 * Nineslice component
 * @moduleName NineSlice
 */
bento.define('bento/components/nineslice', [
    'bento',
    'bento/math/vector2',
    'bento/math/rectangle',
    'bento/entity',
    'bento/eventsystem',
    'bento/utils',
    'bento/tween'
], function (
    Bento,
    Vector2,
    Rectangle,
    Entity,
    EventSystem,
    Utils,
    Tween
) {
    'use strict';
    /**
     * Describe your settings object parameters
     * @param {Object} settings
     */
    var NineSlice = function (settings) {
        if (!(this instanceof NineSlice)) {
            return new NineSlice(settings);
        }
        this.entity = null;
        this.parent = null;
        this.rootIndex = -1;
        this.name = 'nineslice';
        this.visible = true;

        // component settings
        this._width = 0;
        this._height = 0;

        // sprite settings
        this.spriteImage = null;
        this.padding = 0;

        // drawing internals
        this.sliceWidth = 0;
        this.sliceHeight = 0;

        this.setup(settings);
    };

    NineSlice.prototype.setup = function (settings) {
        var self = this;

        if (settings.image) {
            this.spriteImage = settings.image;
        } else if (settings.imageName) {
            // load from string
            if (Bento.assets) {
                this.spriteImage = Bento.assets.getImage(settings.imageName);
            } else {
                throw 'Bento asset manager not loaded';
            }
        } else if (settings.imageFromUrl) {
            // load from url
            if (!this.spriteImage && Bento.assets) {
                Bento.assets.loadImageFromUrl(settings.imageFromUrl, settings.imageFromUrl, function (err, asset) {
                    self.spriteImage = Bento.assets.getImage(settings.imageFromUrl);
                    self.setup(settings);

                    if (settings.onLoad) {
                        settings.onLoad();
                    }
                });
                // wait until asset is loaded and then retry
                return;
            }
        } else {
            // no image specified
            return;
        }

        this.padding = settings.padding || 0;

        if (this.spriteImage) {
            this.sliceWidth = Math.floor((this.spriteImage.width - this.padding * 2) / 3);
            this.sliceHeight = Math.floor((this.spriteImage.height - this.padding * 2) / 3);
        }

        if (settings.width) {
            this._width = Math.max(settings.width || 0, 0);
        }
        if (settings.height) {
            this._height = Math.max(settings.height || 0, 0);
        }

        if (this.entity) {
            // set dimension of entity object
            this.entity.dimension.width = this._width;
            this.entity.dimension.height = this._height;
        }
        recalculateDimensions();
    };

    NineSlice.prototype.attached = function (data) {
        this.entity = data.entity;
        // set dimension of entity object
        this.entity.dimension.width = this._width;
        this.entity.dimension.height = this._height;
    };

    NineSlice.prototype.setWidth = function (width) {
        this._width = Utils.isDefined(width) ? width : this._width;
        this._width = Math.max(this._width, 0);
        if (this.entity) {
            var relOriginX = this.entity.origin.x / this.entity.dimension.width;
            this.entity.dimension.width = this._width;
            this.entity.origin.x = relOriginX * this._width;
        }
        recalculateDimensions();
    };

    NineSlice.prototype.setHeight = function (height) {
        this._height = Utils.isDefined(height) ? height : this._height;
        this._height = Math.max(this.height, 0);
        if (this.entity) {
            var relOriginY = this.entity.origin.y / this.entity.dimension.height;
            this.entity.dimension.height = this._height;
            this.entity.origin.y = relOriginY * this._height;
        }
        recalculateDimensions();
    };

    var recalculateDimensions = function () {
        this.innerWidth = this._width - this.sliceWidth * 2;
        this.innerHeight = this._height - this.sliceHeight * 2;

        this.leftWidth = Math.min(this.sliceWidth, Math.ceil(this._width / 2));
        this.rightWidth = Math.min(this.sliceWidth, Math.floor(this._width / 2));

        this.topHeight = Math.min(this.sliceHeight, Math.ceil(this.height / 2));
        this.bottomHeight = Math.min(this.sliceHeight, Math.floor(this.height / 2));
    };

    NineSlice.prototype.fillArea = function (renderer, frame, x, y, width, height) {
        var sx = (this.sliceWidth + this.padding) * (frame % 3);
        var sy = (this.sliceHeight + this.padding) * Math.floor(frame / 3);

        if (width === 0 || height === 0) {
            return;
        }

        if (!width) {
            width = this.sliceWidth;
        }
        if (!height) {
            height = this.sliceHeight;
        }

        renderer.drawImage(this.spriteImage, sx, sy, this.sliceWidth, this.sliceHeight, x, y, width, height);
    };

    NineSlice.prototype.draw = function (data) {
        var entity = data.entity;
        var origin = data.entity.origin;

        if (this._width === 0 || this._height === 0) {
            return;
        }

        data.renderer.translate(-Math.round(origin.x), -Math.round(origin.y));

        //top left corner
        this.fillArea(data.renderer, 0, 0, 0, this.leftWidth, this.topHeight);
        //top stretch
        this.fillArea(data.renderer, 1, this.sliceWidth, 0, this.innerWidth, this.topHeight);
        //top right corner
        this.fillArea(data.renderer, 2, this._width - this.sliceWidth, 0, this.rightWidth, this.topHeight);
        //left stretch
        this.fillArea(data.renderer, 3, 0, this.sliceHeight, this.leftWidth, this.innerHeight);
        //center stretch
        this.fillArea(data.renderer, 4, this.sliceWidth, this.sliceHeight, this.innerWidth, this.innerHeight);
        //right stretch
        this.fillArea(data.renderer, 5, this._width - this.sliceWidth, this.sliceHeight, this.rightWidth, this.innerHeight);
        //bottom left corner
        this.fillArea(data.renderer, 6, 0, this._height - this.sliceHeight, this.leftWidth, this.bottomHeight);
        //bottom stretch
        this.fillArea(data.renderer, 7, this.sliceWidth, this._height - this.sliceHeight, this.innerWidth, this.bottomHeight);
        //bottom right corner
        this.fillArea(data.renderer, 8, this._width - this.sliceWidth, this._height - this.sliceHeight, this.rightWidth, this.bottomHeight);

        data.renderer.translate(Math.round(origin.x), Math.round(origin.y));
    };

    return NineSlice;
});