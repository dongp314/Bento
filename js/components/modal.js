/**
 * Component for modal popups - pauses the game on start and resets on destroy.
 * The parent entity will not be paused. Pauselevels will stack when more entities with the
 * modal component are attached to the game.
 * <br>Exports: Constructor
 * @module bento/components/modal
 * @moduleName Modal
 * @snippet Modal|constructor
Modal({})
 * @snippet Modal|target
Modal({
    pauseLevel: ${1:1}
})
 * @param {Object} settings - Settings
 * @param {String} [settings.pauseLevel] - Target pause level, recommended to ignore this parameter and
 * let the component set the automatic pause level automatically.
 */
bento.define('bento/components/modal', [
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
    return function (settings) {
        var entity;
        var pauseLevel = settings.pauseLevel; // target pauseLevel
        var oldPauseLevel;
        var component = {
            name: 'modal',
            /*
             * Current pauseLevel
             */
            pauseLevel: 0,
            start: function (data) {
                // set pauselevel to target or current + 1
                oldPauseLevel = Bento.objects.isPaused();

                if (pauseLevel < oldPauseLevel) {
                    pauseLevel = oldPauseLevel + 1;
                    if (!settings.surpressWarnings) {
                        Utils.log('Warning: target pauseLevel (' + settings.pauseLevel +') is lower than current pause (' + oldPauseLevel + ')');
                    }
                }

                component.pauseLevel = pauseLevel || (oldPauseLevel + 1);
                Bento.objects.pause(component.pauseLevel);

                // entity ignores the pause
                entity.updateWhenPaused = component.pauseLevel;
            },
            destroy: function (data) {
                // revert pause
                if (Bento.objects.isPaused() !== component.pauseLevel) {
                    // Utils.log('WARNING: pauseLevel changed while a modal is active. Unexpected behavior might occurr');
                    return;
                }
                Bento.objects.pause(oldPauseLevel);
            },
            attached: function (data) {
                entity = data.entity;
            }
        };
        return component;
    };
});