bento.define('screen2', [
    'bento',
    'bento/math/vector2',
    'bento/math/rectangle',
    'bento/utils',
    'bento/entity',
    'bento/components/sprite',
    'bento/tween',
    'bento/screen'
], function (
    Bento,
    Vector2,
    Rectangle,
    Utils,
    Entity,
    Sprite,
    Tween,
    Screen
) {
    'use strict';
    var object = Screen({
        tiled: 'level2'
    });
    return object;
});