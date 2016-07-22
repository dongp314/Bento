/**
 * A base object to hold components. Has dimension, position, scale and rotation properties (though these don't have much
 meaning until you attach a Sprite component). Entities can be added to the game by calling Bento.objects.attach().
 Entities can be visualized by using the Sprite component, or you can attach your own component and add a draw function.
 * <br>Exports: Constructor
 * @module {Entity} bento/entity
 * @param {Object} settings - settings (all properties are optional)
 * @param {Function} settings.init - Called when entity is initialized
 * @param {Function} settings.onCollide - Called when object collides in HSHG
 * @param {Array} settings.components - Array of component module functions
 * @param {Array} settings.family - Array of family names. See {@link module:bento/managers/object#getByFamily}
 * @param {Vector2} settings.position - Vector2 of position to set
 * @param {Vector2} settings.origin - Vector2 of origin to set
 * @param {Vector2} settings.originRelative - Vector2 of relative origin to set (relative to dimension size)
 * @param {Rectangle} settings.boundingBox - Rectangle position relative to the origin
 * @param {Boolean} settings.z - z-index to set
 * @param {Number} settings.alpha - Opacity of the entity (1 = fully visible)
 * @param {Number} settings.rotation - Rotation of the entity in radians
 * @param {Vector2} settings.scale - Scale of the entity
 * @param {Boolean} settings.updateWhenPaused - Should entity keep updating when game is paused
 * @param {Boolean} settings.global - Should entity remain after hiding a screen
 * @param {Boolean} settings.float - Should entity move with the screen
 * @param {Boolean} settings.useHshg - (DEPRECATED)Should entity use HSHG for collisions
 * @param {Boolean} settings.staticHshg - (DEPRECATED)Is entity a static object in HSHG (doesn't check collisions on others, but can get checked on)
 * @example
var entity = new Entity({
    z: 0,
    name: 'myEntity',
    position: new Vector2(32, 32),
    originRelative: new Vector2(0.5, 1),    // bottom center origin
    components: [new Sprite({
        imageName: 'myImage'
    })] // see Sprite module
 });
 * // attach entity to Bento Objects
 * Bento.objects.attach(entity);
 * @returns {Entity} Returns a new entity object
 */
bento.define('bento/entity', [
    'bento',
    'bento/utils',
    'bento/math/vector2',
    'bento/math/rectangle',
    'bento/math/transformmatrix',
    'bento/transform'
], function (Bento, Utils, Vector2, Rectangle, Matrix, Transform) {
    'use strict';
    var cleanComponents = function (entity) {
        // remove null components
        var i;
        for (i = entity.components.length - 1; i >= 0; --i) {
            if (!entity.components[i]) {
                entity.components.splice(i, 1);
            }
        }
    };
    var id = 0;

    var Entity = function (settings) {
        var i;
        /**
         * Unique id
         * @instance
         * @name id
         */
        this.id = id++;
        /**
         * z-index of an object
         * @instance
         * @default 0
         * @name z
         */
        this.z = 0;
        /**
         * Timer value, incremented every update step
         * @instance
         * @default 0
         * @name timer
         */
        this.timer = 0;
        /**
         * Indicates if an object should not be destroyed when a Screen ends
         * @instance
         * @default false
         * @name global
         */
        this.global = false;
        /**
         * Indicates if an object should move with the scrolling of the screen
         * @instance
         * @default false
         * @name float
         */
        this.float = false;
        /**
         * Indicates if an object should continue updating when the game is paused.
         * If updateWhenPaused is larger or equal than the pause level then the
         * game ignores the pause.
         * @instance
         * @default 0
         * @name updateWhenPaused
         */
        this.updateWhenPaused = 0;
        /**
         * Name of the entity
         * @instance
         * @default ''
         * @name name
         */
        this.name = '';
        this.isAdded = false;
        /**
         * Use Hierarchical Spatial Hash Grids
         * @instance
         * @default ''
         * @name useHshg
         */
        this.useHshg = false;
        /**
         * Position of the entity
         * @instance
         * @default Vector2(0, 0)
         * @name position
         */
        this.position = new Vector2(0, 0);
        /**
         * Origin of the entity (anchor point)
         * @instance
         * @default Vector2(0, 0)
         * @name origin
         */
        this.origin = new Vector2(0, 0);
        /**
         * Families of the entity
         * @instance
         * @default []
         * @see module:bento/managers/object#getByFamily
         * @name family
         */
        this.family = [];
        /**
         * Components of the entity
         * @instance
         * @default []
         * @name components
         */
        this.components = [];
        /**
         * Dimension of the entity
         * @instance
         * @default Rectangle(0, 0, 0, 0)
         * @name dimension
         */
        this.dimension = new Rectangle(0, 0, 0, 0);
        /**
         * Boundingbox of the entity
         * @instance
         * @default null
         * @see module:bento/entity#getBoundingBox for usage
         * @name boundingBox
         */
        this.boundingBox = settings.boundingBox || null;
        /**
         * Scale of the entity
         * @instance
         * @default Vector2(1, 1)
         * @name scale
         */
        this.scale = new Vector2(1, 1);
        /**
         * Rotation of the entity
         * @instance
         * @default 0
         * @name scale
         */
        this.rotation = 0;
        /**
         * Opacity of the entity
         * @instance
         * @default 1
         * @name alpha
         */
        this.alpha = 1;
        /**
         * Whether the entity calls the draw function
         * @instance
         * @default true
         * @name visible
         */
        this.visible = true;
        /**
         * Transform module
         * @instance
         * @name transform
         */
        this.transform = new Transform(this);
        /**
         * Entity's parent object, is set by the attach function
         * @instance
         * @default null
         * @see module:bento/entity#attach
         * @name parent
         */
        this.parent = null;
        /**
         * Reference to the settings parameter passed to the constructor
         * @instance
         * @name settings
         */
        this.settings = settings;

        // read settings
        if (settings) {
            if (settings.position) {
                this.position = settings.position; // should this be cloned?
            }
            if (settings.origin) {
                this.origin = settings.origin;
            }
            if (settings.scale) {
                this.scale = settings.scale;
            }
            if (settings.name) {
                this.name = settings.name;
            }
            if (settings.family) {
                if (!Utils.isArray(settings.family)) {
                    settings.family = [settings.family];
                }
                for (i = 0; i < settings.family.length; ++i) {
                    this.family.push(settings.family[i]);
                }
            }
            if (Utils.isDefined(settings.alpha)) {
                this.alpha = settings.alpha;
            }
            if (Utils.isDefined(settings.rotation)) {
                this.rotation = settings.rotation;
            }

            this.z = settings.z || 0;
            this.updateWhenPaused = settings.updateWhenPaused || 0;
            this.global = settings.global || false;
            this.float = settings.float || false;
            // hshg: deprecated
            this.useHshg = settings.useHshg || false;
            this.staticHshg = settings.staticHshg || false;
            this.onCollide = settings.onCollide;

            // attach components after initializing other variables
            if (settings.components) {
                if (!Utils.isArray(settings.components)) {
                    settings.components = [settings.components];
                }
                for (i = 0; i < settings.components.length; ++i) {
                    this.attach(settings.components[i]);
                }
            }

            // origin relative depends on dimension, so do this after attaching components
            if (settings.originRelative) {
                this.setOriginRelative(settings.originRelative);
            }

            // you might want to do things before the entity returns
            if (settings.init) {
                settings.init.apply(this);
            }

            if (settings.addNow) {
                Bento.objects.add(this);
            }
        }
    };
    Entity.prototype.isEntity = function () {
        return true;
    };

    Entity.prototype.start = function (data) {
        var i,
            l,
            component;
        data = data || {};
        // update components
        for (i = 0, l = this.components.length; i < l; ++i) {
            component = this.components[i];
            if (component && component.start) {
                data.entity = this;
                component.start(data);
            }
        }
    };
    Entity.prototype.destroy = function (data) {
        var i,
            l,
            component,
            components = this.components;
        data = data || {};
        // update components
        for (i = 0, l = components.length; i < l; ++i) {
            component = components[i];
            if (component && component.destroy) {
                data.entity = this;
                component.destroy(data);
            }
        }
    };
    Entity.prototype.update = function (data) {
        var i,
            l,
            component,
            components = this.components;

        data = data || Bento.getGameData();
        // update components
        for (i = 0, l = components.length; i < l; ++i) {
            component = components[i];
            if (component && component.update) {
                data.entity = this;
                component.update(data);
            }
        }

        this.timer += data.speed;

        // clean up
        cleanComponents(this);
    };
    Entity.prototype.draw = function (data) {
        var i, l, component;
        var components = this.components;
        var matrix;
        if (!this.visible) {
            return;
        }
        data = data || Bento.getGameData();

        this.transform.draw(data);

        // call components
        for (i = 0, l = components.length; i < l; ++i) {
            component = components[i];
            if (component && component.draw) {
                data.entity = this;
                component.draw(data);
            }
        }
        // post draw
        for (i = components.length - 1; i >= 0; i--) {
            component = components[i];
            if (component && component.postDraw) {
                data.entity = this;
                component.postDraw(data);
            }
        }

        this.transform.postDraw(data);
    };

    /**
     * Extends properties of entity
     * @function
     * @instance
     * @param {Object} object - other object
     * @see module:bento/utils#extend
     * @example
var entity = new Entity({});

entity.extend({
    addX: function (x) {
        entity.position.x += x;
        // alternatively, this.position.x would work too.
    }
});

entity.addX(10);
     * @returns {Entity} Returns itself
     * @name extend
     */
    Entity.prototype.extend = function (object) {
        return Utils.extend(this, object);
    };
    /**
     * Returns the bounding box of an entity that's ready to be compared for collisions.
     * If no bounding box was set to entity.boundingBox, the dimension assumed as bounding box size.
     * entity.boundingBox is a Rectangle set relatively the entity's origin, while getBoundingBox returns
     * a rectangle that's positioned in the world and scaled appropiately (AABB only, does not take into account rotation)
     * @function
     * @returns {Rectangle} boundingbox - Entity's boundingbox with translation and scaling
     * @instance
     * @name getBoundingBox
     * @returns {Rectangle} A rectangle representing the boundingbox of the entity
     */
    Entity.prototype.getBoundingBox = function () {
        var scale, x1, x2, y1, y2, box;
        if (!this.boundingBox) {
            // TODO get rid of scale component dependency
            scale = this.scale ? this.scale : new Vector2(1, 1);
            x1 = this.position.x - this.origin.x * scale.x;
            y1 = this.position.y - this.origin.y * scale.y;
            x2 = this.position.x + (this.dimension.width - this.origin.x) * scale.x;
            y2 = this.position.y + (this.dimension.height - this.origin.y) * scale.y;
            // swap variables if scale is negative
            if (scale.x < 0) {
                x2 = [x1, x1 = x2][0];
            }
            if (scale.y < 0) {
                y2 = [y1, y1 = y2][0];
            }
            return new Rectangle(x1, y1, x2 - x1, y2 - y1);
        } else {
            // TODO: cloning could be expensive for polygons
            box = this.boundingBox.clone();
            scale = this.scale ? this.scale : new Vector2(1, 1);
            box.x *= Math.abs(scale.x);
            box.y *= Math.abs(scale.y);
            box.width *= Math.abs(scale.x);
            box.height *= Math.abs(scale.y);
            box.x += this.position.x;
            box.y += this.position.y;
            return box;
        }
    };
    /**
     * Sets the origin relatively (0...1), relative to the dimension of the entity.
     * @function
     * @param {Vector2} origin - Position of the origin (relative to upper left corner of the dimension)
     * @instance
     * @name setOriginRelative
     */
    Entity.prototype.setOriginRelative = function (value) {
        this.origin.x = value.x * this.dimension.width;
        this.origin.y = value.y * this.dimension.height;
    };
    /*
     * Entity was attached, calls onParentAttach to all children
     */
    Entity.prototype.attached = function (data) {
        var i,
            l,
            component;

        if (data) {
            data.entity = this;
            data.parent = this.parent;
        } else {
            data = {
                entity: this,
                parent: this.parent
            };
        }
        // update components
        for (i = 0, l = this.components.length; i < l; ++i) {
            component = this.components[i];
            if (component) {
                if (component.onParentAttached) {
                    data.entity = this;
                    component.onParentAttached(data);
                }
            }
        }
    };
    /*
     * Calls onParentCollided on every child, additionally calls onCollide on self afterwards
     */
    Entity.prototype.collided = function (data) {
        var i,
            l,
            component;

        if (data) {
            data.entity = this;
            data.parent = this.parent;
        } else {
            throw "Must pass a data object";
        }
        // update components
        for (i = 0, l = this.components.length; i < l; ++i) {
            component = this.components[i];
            if (component) {
                if (component.onParentCollided) {
                    data.entity = this;
                    component.onParentCollided(data);
                }
            }
        }
        if (this.onCollide) {
            this.onCollide(data.other);
        }
    };
    /**
     * Attaches a child object to the entity. Entities can form a scenegraph this way.
     * This is one of the most important functions in Bento. It allows you to attach new behaviors
     * to the entity by attaching components or other Entities.
     * The parent entity calls start(), destroy(), update() and draw() in the child.
     * The child will have a 'parent' property, which references the parent entity.
     * @function
     * @param {Object} child - The child object to attach (can be anything)
     * @param {Boolean} force - Allow duplicate attaching
     * @instance
     * @example
var entity = new Entity({}),
    // we define a simple object literal that acts as a container for functions
    child = {
        name: 'childObject', // for retrieving the child later if needed
        start: function (data) {
            console.log('Logged when entity is attached (not when child is attached)');
        },
        destroy: function (data) {
            console.log('Logged when child is removed or when entity is removed');
        },
        update: function (data) {
            console.log('Logged every tick during the update loop');
        },
        draw: function (data) {
            console.log('Logged every tick during the draw loop');
        }
    };

// You can use object literals to attach or define new classes. The child could also be another Entity with a sprite!
entity.attach(child);

// attach the entity to the game
Bento.objects.attach(entity);
     * @name attach
     * @returns {Entity} Returns itself (useful for chaining attach calls)
     */
    Entity.prototype.attach = function (child, force) {
        var mixin = {},
            parent = this;

        if (!force && (child.isAdded || child.parent)) {
            Utils.log("ERROR: Child " + child.name + " was already attached.");
            return;
        }

        this.components.push(child);

        child.parent = this;

        if (child.init) {
            child.init();
        }
        if (child.attached) {
            child.attached({
                entity: this
            });
        }
        if (this.isAdded) {
            if (child.start) {
                child.start();
            }
        } else {
            if (parent.parent) {
                parent = parent.parent;
            }
            while (parent) {
                if (parent.isAdded) {
                    if (child.start) {
                        child.start();
                    }
                }
                parent = parent.parent;
            }
        }
        return this;
    };
    /**
     * Removes a child object from the entity. Note that destroy will be called in the child.
     * @function
     * @param {Object} child - The child object to remove
     * @instance
     * @name remove
     * @returns {Entity} Returns itself
     */
    Entity.prototype.remove = function (child) {
        var i, type, index;
        if (!child) {
            return;
        }
        index = this.components.indexOf(child);
        if (index >= 0) {
            if (child.destroy) {
                child.destroy();
            }
            child.parent = null;
            // TODO: clean child
            this.components[index] = null;
        }
        return this;
    };
    /**
     * Callback when component is found
     * this: refers to the component
     *
     * @callback FoundCallback
     * @param {Component} component - The component
     * @param {Number} index - Index of the component
     */
    /**
     * Returns the first child found with a certain name
     * @function
     * @instance
     * @param {String} name - name of the component
     * @param {FoundCallback} callback - called when component is found
     * @name getComponent
     * @returns {Entity} Returns the component, null if not found
     */
    Entity.prototype.getComponent = function (name, callback) {
        var i, l, component;
        for (i = 0, l = this.components.length; i < l; ++i) {
            component = this.components[i];
            if (component && component.name === name) {
                if (callback) {
                    callback.apply(component, [component, i]);
                }
                return component;
            }
        }
        return null;
    };
    /**
     * Moves a child to a certain index in the array
     * @function
     * @instance
     * @param {Object} child - reference to the child
     * @param {Number} index - new index
     * @name moveComponentTo
     */
    Entity.prototype.moveComponentTo = function (component, newIndex) {
        // note: currently dangerous to do during an update loop
        var i, type, index;
        if (!component) {
            return;
        }
        index = this.components.indexOf(component);
        if (index >= 0) {
            // remove old
            this.components.splice(index, 1);
            // insert at new place
            this.components.splice(newIndex, 0, component);
        }
    };
    /**
     * Callback when entities collide.
     *
     * @callback CollisionCallback
     * @param {Entity} other - The other entity colliding
     */
    /**
     * Checks if entity is colliding with another entity or entities
     * @function
     * @instance
     * @param {Object} settings
     * @param {Entity} settings.entity - The other entity
     * @param {Array} settings.entities - Or an array of entities to check with
     * @param {String} settings.name - Or the other entity's name (use family for better performance)
     * @param {String} settings.family - Or the name of the family to collide with
     * @param {Vector2} [settings.offset] - A position offset
     * @param {CollisionCallback} [settings.callback] - Called when entities are colliding
     * @param {Boolean} [settings.firstOnly] - For detecting only first collision or more, default true
     * @name collidesWith
     * @returns {Entity/Array} The collided entity/entities, otherwise null
     */
    // TODO: make examples
    // * @param {Array} settings.families - multiple families
    Entity.prototype.collidesWith = function (settings, deprecated_offset, deprecated_callback) {
        var intersect = false;
        var box;
        var i;
        var obj;
        var array = [];
        var offset = new Vector2(0, 0);
        var callback;
        var firstOnly = true;
        var collisions = null;

        if (settings.isEntity) {
            // old method with parameters: collidesWith(entity, offset, callback)
            array = [settings];
            offset = deprecated_offset || offset;
            callback = deprecated_callback;
        } else if (Utils.isArray(settings)) {
            // old method with parameters: collidesWith(array, offset, callback)
            array = settings;
            offset = deprecated_offset || offset;
            callback = deprecated_callback;
        } else {
            // read settings
            offset = settings.offset || offset;
            if (Utils.isDefined(settings.firstOnly)) {
                firstOnly = settings.firstOnly;
            }
            callback = settings.onCollide;

            if (settings.entity) {
                // single entity
                if (!settings.entity.isEntity) {
                    Utils.log("WARNING: settings.entity is not an entity");
                    return null;
                }
                array = [settings.entity];
            } else if (settings.entities) {
                if (!Utils.isArray(settings.entities)) {
                    Utils.log("WARNING: settings.entity is not an entity");
                    return null;
                }
                array = [settings.entities];
            } else if (settings.name) {
                array = Bento.objects.getByName(settings.name);
            } else if (settings.family) {
                array = Bento.objects.getByFamily(settings.family);
            }
        }

        if (!array.length) {
            return null;
        }
        box = this.getBoundingBox().offset(offset);
        for (i = 0; i < array.length; ++i) {
            obj = array[i];
            if (obj.id && obj.id === this.id) {
                continue;
            }
            if (obj.getBoundingBox && box.intersect(obj.getBoundingBox())) {
                if (callback) {
                    callback(obj);
                }
                if (firstOnly) {
                    // return the first collision it can find
                    return obj;
                } else {
                    // collect other collisions
                    collisions = collisions || [];
                    collisions.push(obj);
                }
            }
        }
        return collisions;
    };
    /* DEPRECATED
     * Checks if entity is colliding with any entity in an array
     * Returns the first entity it finds that collides with the entity.
     * @function
     * @instance
     * @param {Object} settings
     * @param {Array} settings.entities - Array of entities, ignores self if present
     * @param {Array} settings.family - Name of family
     * @param {Vector2} [settings.offset] - A position offset
     * @param {CollisionCallback} [settings.onCollide] - Called when entities are colliding
     * @name collidesWithGroup
     * @returns {Entity} Returns the entity it collides with, null if none found
     */
    Entity.prototype.collidesWithGroup = function (settings, deprecated_offset, deprecated_callback) {
        var i, obj, box;
        var array, offset, callback;

        // old method with parameters
        if (Utils.isArray(settings) || Utils.isDefined(deprecated_offset) || Utils.isDefined(deprecated_callback)) {
            array = settings;
            offset = deprecated_offset || new Vector2(0, 0);
            callback = deprecated_callback;
        } else {
            array = settings.other;
            offset = settings.offset;
            callback = settings.onCollide;
        }

        if (!Utils.isArray(array)) {
            Utils.log("ERROR: Collision check must be with an Array of object");
            return;
        }
        if (!array.length) {
            return null;
        }
        box = this.getBoundingBox().offset(offset);
        for (i = 0; i < array.length; ++i) {
            obj = array[i];
            if (obj.id && obj.id === this.id) {
                continue;
            }
            if (obj.getBoundingBox && box.intersect(obj.getBoundingBox())) {
                if (callback) {
                    callback(obj);
                }
                return obj;
            }
        }
        return null;
    };

    // for use with Hshg
    Entity.prototype.getAABB = function () {
        var box;
        if (this.staticHshg) {
            // cache boundingbox
            if (!this.box) {
                this.box = this.getBoundingBox();
            }
            box = this.box;
        } else {
            box = this.getBoundingBox();
        }
        return {
            min: [box.x, box.y],
            max: [box.x + box.width, box.y + box.height]
        };
    };
    /**
     * Transforms this entity's position to the world position
     * @function
     * @instance
     * @name getWorldPosition
     * @returns {Vector2} Returns a position
     */
    Entity.prototype.getWorldPosition = function () {
        return this.transform.getWorldPosition();
    };

    /**
     * Transforms a world position to the entity's local position
     * @function
     * @instance
     * @name getLocalPosition
     * @param {Vector2} worldPosition - A position to transform to local position
     * @returns {Vector2} Returns a position relative to the entity's parent
     */
    Entity.prototype.getLocalPosition = function (worldPosition) {
        return this.transform.getLocalPosition(worldPosition);
    };

    Entity.prototype.toString = function () {
        return '[object Entity]';
    };

    return Entity;
});