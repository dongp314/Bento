/**
 * WebGL renderer using gl-sprites by Matt DesLauriers
 * @copyright (C) 2015 LuckyKat
 */
bento.define('bento/renderers/webgl', [
    'bento/utils',
    'bento/renderers/canvas2d'
], function (Utils, Canvas2d) {
    return function (canvas, settings) {
        var canWebGl = (function () {
                // try making a canvas
                try {
                    var canvas = document.createElement('canvas');
                    return !!window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
                } catch (e) {
                    return false;
                }
            })(),
            context,
            glRenderer,
            original,
            pixelSize = 1,
            pixelRatio = window.devicePixelRatio,
            windowWidth = window.innerWidth * window.devicePixelRatio,
            windowHeight = window.innerHeight * window.devicePixelRatio,
            renderer = {
                name: 'webgl',
                save: function () {
                    glRenderer.save();
                },
                restore: function () {
                    glRenderer.restore();
                },
                translate: function (x, y) {
                    glRenderer.translate(x, y);
                },
                scale: function (x, y) {
                    glRenderer.scale(x, y);
                },
                rotate: function (angle) {
                    glRenderer.rotate(angle);
                },
                fillRect: function (color, x, y, w, h) {
                    var oldColor = glRenderer.color;
                    // 
                    renderer.setColor(color);
                    glRenderer.fillRect(x, y, w, h);
                    glRenderer.color = oldColor;
                },
                fillCircle: function (color, x, y, radius) {},
                strokeRect: function (color, x, y, w, h) {
                    var oldColor = glRenderer.color;
                    // 
                    renderer.setColor(color);
                    glRenderer.strokeRect(x, y, w, h);
                    glRenderer.color = oldColor;
                },
                drawImage: function (packedImage, sx, sy, sw, sh, x, y, w, h) {
                    var image = packedImage.image;
                    if (!image.texture) {
                        image.texture = window.GlSprites.createTexture2D(context, image);
                    }
                    glRenderer.drawImage(image.texture, packedImage.x + sx, packedImage.y + sy, sw, sh, x, y, sw, sh);
                },
                begin: function () {
                    glRenderer.begin();
                },
                flush: function () {
                    glRenderer.end();
                },
                setColor: function (color) {
                    glRenderer.color = color;
                },
                getOpacity: function () {
                    return glRenderer.color[3];
                },
                setOpacity: function (value) {
                    glRenderer.color[3] = value;
                },
                createSurface: function (width, height) {
                    var newCanvas = document.createElement('canvas'),
                        newContext,
                        newGlRenderer;

                    newCanvas.width = width;
                    newCanvas.height = height;

                    newContext = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    newGlRenderer = new window.GlSprites.SpriteRenderer(newContext);
                    newGlRenderer.ortho(canvas.width, canvas.height);

                    return {
                        canvas: newCanvas,
                        context: newGlRenderer
                    };
                },
                setContext: function (ctx) {
                    glRenderer = ctx;
                },
                restoreContext: function () {
                    glRenderer = original;
                }
            };
        console.log('Init webgl as renderer');
        // smoothing
        if (!settings.smoothing) {
            if (windowWidth > windowHeight) {
                pixelSize = Math.round(Math.max(windowHeight / canvas.height, 1));
            } else {
                pixelSize = Math.round(Math.max(windowWidth / canvas.width, 1));

            }
        }

        // fallback
        if (canWebGl && Utils.isDefined(window.GlSprites)) {
            canvas.width *= pixelSize;
            canvas.height *= pixelSize;
            context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

            glRenderer = new window.GlSprites.SpriteRenderer(context);
            glRenderer.ortho(canvas.width / pixelSize, canvas.height / pixelSize);
            original = glRenderer;
            return renderer;
        } else {
            console.log('webgl failed, revert to canvas');
            return Canvas2d(canvas, settings);
        }
    };
});