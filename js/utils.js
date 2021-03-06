/**
 * A collection of useful functions
 * <br>Exports: Object
 * @module bento/utils
 * @moduleName Utils
 */
bento.define('bento/utils', [], function () {
    'use strict';
    var Utils,
        dev = false,
        isString = function (value) {
            return typeof value === 'string' || value instanceof String;
        },
        isArray = Array.prototype.isArray || function (value) {
            return Object.prototype.toString.call(value) === '[object Array]';
        },
        isObject = function (value) {
            return Object.prototype.toString.call(value) === '[object Object]';
        },
        isFunction = function (value) {
            return Object.prototype.toString.call(value) === '[object Function]';
        },
        isNumber = function (obj) {
            return Object.prototype.toString.call(obj) === '[object Number]';
        },
        isBoolean = function (obj) {
            return obj === true || obj === false ||
                Object.prototype.toString.call(obj) === '[object Boolean]';
        },
        isInt = function (obj) {
            return parseFloat(obj) === parseInt(obj, 10) && !isNaN(obj);
        },
        isUndefined = function (obj) {
            return obj === void(0);
        },
        isDefined = function (obj) {
            return obj !== void(0);
        },
        isEmpty = function (obj) {
            return obj == null;
        },
        isNotEmpty = function (obj) {
            return obj != null;
        },
        isObjLiteral = function (_obj) {
            var _test = _obj;
            return (typeof _obj !== 'object' || _obj === null ?
                false :
                (
                    (function () {
                        while (!false) {
                            if (Object.getPrototypeOf(_test = Object.getPrototypeOf(_test)) === null) {
                                break;
                            }
                        }
                        return Object.getPrototypeOf(_obj) === _test;
                    })()
                )
            );
        },
        removeFromArray = function (array, obj) {
            var index = array.indexOf(obj);
            var removed = false;
            while (index >= 0) {
                array.splice(index, 1);
                index = array.indexOf(obj);
                removed = true;
            }
            return removed;
        },
        extend = function (obj1, obj2, force, onConflict) {
            var prop, temp;
            for (prop in obj2) {
                if (obj2.hasOwnProperty(prop)) {
                    if (obj1.hasOwnProperty(prop) && !force) {
                        // property already exists, move it up
                        obj1.base = obj1.base || {};
                        temp = {};
                        temp[prop] = obj1[prop];
                        extend(obj1.base, temp);
                        if (onConflict) {
                            onConflict(prop);
                        }
                    }
                    if (isObjLiteral(obj2[prop])) {
                        obj1[prop] = extend({}, obj2[prop]);
                    } else {
                        obj1[prop] = obj2[prop];
                    }
                }
            }
            return obj1;
        },
        getKeyLength = function (obj) {
            if (!obj) {
                Utils.log("WARNING: object is " + obj);
                return 0;
            }
            return Object.keys(obj).length;
        },
        copyObject = function (obj) {
            var newObject = {};
            var key;
            for (key in obj) {
                if (!obj.hasOwnProperty(key)) {
                    continue;
                }
                newObject[key] = obj[key];
                //TODO? deep copy?
            }
            return newObject;
        },
        setAnimationFrameTimeout = function (callback, timeout) {
            var now = new Date().getTime(),
                rafID = null;

            if (timeout === undefined) timeout = 1;

            function animationFrame() {
                var later = new Date().getTime();

                if (later - now >= timeout) {
                    callback();
                } else {
                    rafID = window.requestAnimationFrame(animationFrame);
                }
            }

            animationFrame();
            return {
                cancel: function () {
                    if (typeof cancelAnimationFrame !== 'undefined') {
                        window.cancelAnimationFrame(rafID);
                    }
                }
            };
        },
        stableSort = (function () {
            // https://github.com/Two-Screen/stable
            // A stable array sort, because `Array#sort()` is not guaranteed stable.
            // This is an implementation of merge sort, without recursion.
            var stable = function (arr, comp) {
                    return exec(arr.slice(), comp);
                },
                // Execute the sort using the input array and a second buffer as work space.
                // Returns one of those two, containing the final result.
                exec = function (arr, comp) {
                    if (typeof (comp) !== 'function') {
                        comp = function (a, b) {
                            return String(a).localeCompare(b);
                        };
                    }

                    // Short-circuit when there's nothing to sort.
                    var len = arr.length;
                    if (len <= 1) {
                        return arr;
                    }

                    // Rather than dividing input, simply iterate chunks of 1, 2, 4, 8, etc.
                    // Chunks are the size of the left or right hand in merge sort.
                    // Stop when the left-hand covers all of the array.
                    var buffer = new Array(len);
                    for (var chk = 1; chk < len; chk *= 2) {
                        pass(arr, comp, chk, buffer);

                        var tmp = arr;
                        arr = buffer;
                        buffer = tmp;
                    }
                    return arr;
                },
                // Run a single pass with the given chunk size.
                pass = function (arr, comp, chk, result) {
                    var len = arr.length;
                    var i = 0;
                    // Step size / double chunk size.
                    var dbl = chk * 2;
                    // Bounds of the left and right chunks.
                    var l, r, e;
                    // Iterators over the left and right chunk.
                    var li, ri;

                    // Iterate over pairs of chunks.
                    for (l = 0; l < len; l += dbl) {
                        r = l + chk;
                        e = r + chk;
                        if (r > len) r = len;
                        if (e > len) e = len;

                        // Iterate both chunks in parallel.
                        li = l;
                        ri = r;
                        while (true) {
                            // Compare the chunks.
                            if (li < r && ri < e) {
                                // This works for a regular `sort()` compatible comparator,
                                // but also for a simple comparator like: `a > b`
                                if (comp(arr[li], arr[ri]) <= 0) {
                                    result[i++] = arr[li++];
                                } else {
                                    result[i++] = arr[ri++];
                                }
                            }
                            // Nothing to compare, just flush what's left.
                            else if (li < r) {
                                result[i++] = arr[li++];
                            } else if (ri < e) {
                                result[i++] = arr[ri++];
                            }
                            // Both iterators are at the chunk ends.
                            else {
                                break;
                            }
                        }
                    }
                };
            stable.inplace = function (arr, comp) {
                var result = exec(arr, comp);

                // This simply copies back if the result isn't in the original array,
                // which happens on an odd number of passes.
                if (result !== arr) {
                    pass(result, null, arr.length, arr);
                }

                return arr;
            };
            // return it instead and keep the method local to this scope
            return stable;
        })(),
        keyboardMapping = (function () {
            var aI,
                keys = {
                    // http://github.com/RobertWhurst/KeyboardJS
                    // general
                    "3": ["cancel"],
                    "8": ["backspace"],
                    "9": ["tab"],
                    "12": ["clear"],
                    "13": ["enter"],
                    "16": ["shift"],
                    "17": ["ctrl"],
                    "18": ["alt", "menu"],
                    "19": ["pause", "break"],
                    "20": ["capslock"],
                    "27": ["escape", "esc"],
                    "32": ["space", "spacebar"],
                    "33": ["pageup"],
                    "34": ["pagedown"],
                    "35": ["end"],
                    "36": ["home"],
                    "37": ["left"],
                    "38": ["up"],
                    "39": ["right"],
                    "40": ["down"],
                    "41": ["select"],
                    "42": ["printscreen"],
                    "43": ["execute"],
                    "44": ["snapshot"],
                    "45": ["insert", "ins"],
                    "46": ["delete", "del"],
                    "47": ["help"],
                    "91": ["command", "windows", "win", "super", "leftcommand", "leftwindows", "leftwin", "leftsuper"],
                    "92": ["command", "windows", "win", "super", "rightcommand", "rightwindows", "rightwin", "rightsuper"],
                    "145": ["scrolllock", "scroll"],
                    "186": ["semicolon", ";"],
                    "187": ["equal", "equalsign", "="],
                    "188": ["comma", ","],
                    "189": ["dash", "-"],
                    "190": ["period", "."],
                    "191": ["slash", "forwardslash", "/"],
                    "192": ["graveaccent", "`"],

                    "195": ["GamepadA"],
                    "196": ["GamepadB"],
                    "197": ["GamepadX"],
                    "198": ["GamepadY"],
                    "199": ["GamepadRightShoulder"], // R1
                    "200": ["GamepadLeftShoulder"], // L1
                    "201": ["GamepadLeftTrigger"], // L2
                    "202": ["GamepadRightTrigger"], // R2
                    "203": ["GamepadDPadUp"],
                    "204": ["GamepadDPadDown"],
                    "205": ["GamepadDPadLeft"],
                    "206": ["GamepadDPadRight"],
                    "207": ["GamepadMenu"], // 'start' button
                    "208": ["GamepadView"], // 'select' button
                    "209": ["GamepadLeftThumbstick"], // pressed left thumbstick
                    "210": ["GamepadRightThumbstick"], // pressed right thumbstick
                    "211": ["GamepadLeftThumbstickUp"],
                    "212": ["GamepadLeftThumbstickDown"],
                    "213": ["GamepadLeftThumbstickRight"],
                    "214": ["GamepadLeftThumbstickLeft"],
                    "215": ["GamepadRightThumbstickUp"],
                    "216": ["GamepadRightThumbstickDown"],
                    "217": ["GamepadRightThumbstickRight"],
                    "218": ["GamepadRightThumbstickLeft"],
                    "7": ["GamepadXboxButton"], // the middle xbox button

                    "219": ["openbracket", "["],
                    "220": ["backslash", "\\"],
                    "221": ["closebracket", "]"],
                    "222": ["apostrophe", "'"],

                    //0-9
                    "48": ["zero", "0"],
                    "49": ["one", "1"],
                    "50": ["two", "2"],
                    "51": ["three", "3"],
                    "52": ["four", "4"],
                    "53": ["five", "5"],
                    "54": ["six", "6"],
                    "55": ["seven", "7"],
                    "56": ["eight", "8"],
                    "57": ["nine", "9"],

                    //numpad
                    "96": ["numzero", "num0"],
                    "97": ["numone", "num1"],
                    "98": ["numtwo", "num2"],
                    "99": ["numthree", "num3"],
                    "100": ["numfour", "num4"],
                    "101": ["numfive", "num5"],
                    "102": ["numsix", "num6"],
                    "103": ["numseven", "num7"],
                    "104": ["numeight", "num8"],
                    "105": ["numnine", "num9"],
                    "106": ["nummultiply", "num*"],
                    "107": ["numadd", "num+"],
                    "108": ["numenter"],
                    "109": ["numsubtract", "num-"],
                    "110": ["numdecimal", "num."],
                    "111": ["numdivide", "num/"],
                    "144": ["numlock", "num"],

                    //function keys
                    "112": ["f1"],
                    "113": ["f2"],
                    "114": ["f3"],
                    "115": ["f4"],
                    "116": ["f5"],
                    "117": ["f6"],
                    "118": ["f7"],
                    "119": ["f8"],
                    "120": ["f9"],
                    "121": ["f10"],
                    "122": ["f11"],
                    "123": ["f12"],

                    // volume keys Microsoft Surface
                    "174": ["volDown"],
                    "175": ["volUp"]
                };
            for (aI = 65; aI <= 90; aI += 1) {
                keys[aI] = keys[aI] || [];
                keys[aI].push(String.fromCharCode(aI + 32));
            }

            return keys;
        })(),
        remoteMapping = (function () {
            // the commented out keys are not used by the remote's micro gamepad
            var buttons = {
                "0": ["A", "a", "click"], // click on touch area
                // "1": ["B"],
                "2": ["X", "x", "play", "pause"], // pause/play button
                // "3": ["Y"],
                // "4": ["L1"],
                // "5": ["R1"],
                // "6": ["L2"],
                // "7": ["R2"],
                "12": ["up"], // upper half touch area
                "13": ["down"], // lower half touch area
                "14": ["left"], // left half touch area
                "15": ["right"], // right half touch area
                "16": ["menu"] // menu button
            };

            return buttons;
        })(),
        /**
         * Mapping for the Xbox controller
         * @return {Object} mapping of all the buttons
         */
        gamepadMapping = (function () {
            var buttons = {
                "0": ["A", "a"],
                "1": ["B", "b"],
                "2": ["X", "x"],
                "3": ["Y", "y"],
                "4": ["L1", "l1"],
                "5": ["R1", "r1"],
                "6": ["L2", "l2"],
                "7": ["R2", "r2"],
                "8": ["back", "select"],
                "9": ["start"],
                "10": ["right-thumb", "right-stick"],
                "11": ["left-thumb", "left-stick"],
                "12": ["up"],
                "13": ["down"],
                "14": ["left"],
                "15": ["right"],
                "16": ["menu", "home"]
            };

            return buttons;
        })();

    Utils = {
        /**
         * Checks if environment is iOS (using Cocoon.io)
         * @function
         * @instance
         * @name isNativeIos
         * @snippet Utils.isNativeIos|Boolean
        Utils.isNativeIos()
         */
        isNativeIos: function () {
            if (navigator.isCocoonJS && window.Cocoon && window.Cocoon.getPlatform() === 'ios') {
                return true;
            } else if (window.device) {
                if (window.device && window.device.platform) {
                    return window.device.platform.toLowerCase() === 'ios';
                }
            }
            return false;
        },
        /**
         * Checks if environment is Android (using Cocoon.io)
         * @function
         * @instance
         * @name isNativeAndroid
         * @snippet Utils.isNativeAndroid|Boolean
        Utils.isNativeAndroid()
         */
        isNativeAndroid: function () {
            var platform;
            if (navigator.isCocoonJS && window.Cocoon) {
                platform = window.Cocoon.getPlatform();
                if (platform === 'android' || platform === 'amazon') {
                    return true;
                }
            } else if (window.device) {
                if (window.device && window.device.platform) {
                    return window.device.platform.toLowerCase() === 'android';
                }
            }
            return false;
        },
        /**
         * Callback during foreach
         *
         * @callback IteratorCallback
         * @param {Object} value - The value in the array or object literal
         * @param {Number} index - Index of the array or key in object literal
         * @param {Number} length - Length of the array or key count in object literal
         * @param {Function} breakLoop - Calling this breaks the loop and stops iterating over the array or object literal
         */
        /**
         * Loops through an array
         * @function
         * @instance
         * @param {Array/Object} array - Array or Object literal to loop through
         * @param {IteratorCallback} callback - Callback function
         * @name forEach
         * @snippet Utils.forEach|snippet
Utils.forEach(${1:array}, function (${2:item}, i, l, breakLoop) {
    ${3:// code here}
});
         */
        forEach: function (array, callback) {
            var obj;
            var i;
            var l;
            var stop = false;
            var breakLoop = function () {
                stop = true;
            };
            if (Utils.isArray(array)) {
                for (i = 0, l = array.length; i < l; ++i) {
                    callback(array[i], i, l, breakLoop, array[i + 1]);
                    if (stop) {
                        return;
                    }
                }
            } else {
                l = Utils.getKeyLength(array);
                for (i in array) {
                    if (!array.hasOwnProperty(i)) {
                        continue;
                    }
                    callback(array[i], i, l, breakLoop);
                    if (stop) {
                        return;
                    }
                }
            }
        },
        /**
         * Returns either the provided value, or the provided fallback value in case the provided value was undefined
         * @function
         * @instance
         * @name getDefault
         * @snippet Utils.getDefault|snippet
        Utils.getDefault(${1:value}, ${2:default})
         * @param {Anything} value - any type
         * @param {Anything} value - any type
         */
        getDefault: function (param, fallback) {
            return (param !== void(0)) ? param : fallback;
        },
        /**
         * Returns a random integer [0...n)
         * @function
         * @instance
         * @name getRandom
         * @snippet Utils.getRandom|Number
        Utils.getRandom(${1:Number})
         * @param {Number} n - limit of random number
         * @return {Number} Randomized integer
         */
        getRandom: function (n) {
            return Math.floor(Math.random() * n);
        },
        /**
         * Returns a random integer between range [min...max)
         * @function
         * @instance
         * @name getRandomRange
         * @snippet Utils.getRandomRange|Number
        Utils.getRandomRange(${1:Minimum}, ${2:Number})
         * @param {Number} min - minimum value
         * @param {Number} max - maximum value
         * @return {Number} Randomized integer
         */
        getRandomRange: function (min, max) {
            var diff = max - min;
            return min + Math.floor(Math.random() * diff);
        },
        /**
         * Returns a random float [0...n)
         * @function
         * @instance
         * @name getRandomFloat
         * @snippet Utils.getRandomFloat|Number
        Utils.getRandomFloat(${1:Number})
         * @param {Number} n - limit of random number
         * @return {Number} Randomized number
         */
        getRandomFloat: function (n) {
            return Math.random() * n;
        },
        /**
         * Returns a random float between range [min...max)
         * @function
         * @instance
         * @name getRandomRangeFloat
         * @snippet Utils.getRandomRangeFloat|Number
        Utils.getRandomRangeFloat(${1:Minimum}, ${2:Number})
         * @param {Number} min - minimum value
         * @param {Number} max - maximum value
         * @return {Number} Randomized number
         */
        getRandomRangeFloat: function (min, max) {
            var diff = max - min;
            return min + Math.random() * diff;
        },
        /**
         * Get the inner size of the screen (MRAID compatible).
         * In case of the browsers, the screensize is the innerwidth and innerheight
         * @function
         * @instance
         * @returns Object
         * @name getScreenSize
         * @snippet Utils.getScreenSize|Object
        Utils.getScreenSize()
         */
        getScreenSize: function () {
            var screenSize = {
                width: 0,
                height: 0
            };
            if (window.dapi) {
                screenSize.width = window.dapi.getScreenSize().width;
                screenSize.height = window.dapi.getScreenSize().height;
            } else if (window.mraid) {
                screenSize.width = window.mraid.getMaxSize().width;
                screenSize.height = window.mraid.getMaxSize().height;
            } else {
                screenSize.width = window.innerWidth;
                screenSize.height = window.innerHeight;
            }
            return screenSize;
        },
        /**
         * Turns degrees into radians
         * @function
         * @instance
         * @name toRadian
         * @snippet Utils.toRadian|Number
        Utils.toRadian(${1:Degrees})
         * @param {Number} degree - value in degrees
         * @return {Number} radians
         */
        toRadian: function (degree) {
            return degree * Math.PI / 180;
        },
        /**
         * Turns radians into degrees
         * @function
         * @instance
         * @name toDegree
         * @snippet Utils.toDegree|Number
        Utils.toDegree(${1:Radians})
         * @param {Number} radians - value in radians
         * @return {Number} degree
         */
        toDegree: function (radian) {
            return radian / Math.PI * 180;
        },
        /**
         * Sign of a number. Returns 0 if value is 0.
         * @function
         * @instance
         * @param {Number} value - value to check
         * @name sign
         * @snippet Utils.sign|Number
        Utils.sign(${1:Number})
         */
        sign: function (value) {
            if (value > 0) {
                return 1;
            } else if (value < 0) {
                return -1;
            } else {
                return 0;
            }
        },
        /**
         * Steps towards a number without going over the limit
         * @function
         * @instance
         * @param {Number} start - current value
         * @param {Number} end - target value
         * @param {Number} step - step to take (should always be a positive value)
         * @name approach
         * @snippet Utils.approach|Number
        Utils.approach(${1:start}, ${2:end}, ${3:step})
         */
        approach: function (start, end, max) {
            max = Math.abs(max);
            if (start < end) {
                return Math.min(start + max, end);
            } else {
                return Math.max(start - max, end);
            }
        },
        /**
         * Repeats a function for a number of times
         * @function
         * @instance
         * @param {Number} number - Number of times to repeat
         * @param {Function} fn - function to perform
         * @param {Array} [params] - Parameters to pass to function
         * @name repeat
         * @snippet Utils.repeat|snippet
        Utils.repeat(${1:1}, ${2:function (i, l) {\}})
         */
        repeat: function (number, fn) {
            var i;
            var count;
            var action;
            if (typeof number === "number") {
                count = number;
                action = fn;
            } else {
                // swapped the parameters
                count = fn;
                action = number;
            }
            if (!action.apply) {
                Utils.log("Did not pass a function");
                return;
            }
            for (i = 0; i < count; ++i) {
                action(i, count);
            }
        },
        /**
         * A simple hashing function, similar to Java's String.hashCode()
         * source: http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
         * @function
         * @instance
         * @param {String} string - String to hash
         * @name checksum
         * @snippet Utils.checksum|Number
        Utils.checksum(${1:String})
         */
        checksum: function (str) {
            var hash = 0,
                strlen = (str || '').length,
                i,
                c;
            if (strlen === 0) {
                return hash;
            }
            for (i = 0; i < strlen; ++i) {
                c = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + c;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash;
        },
        /**
         * Extends object literal properties with another object
         * If the objects have the same property name, then the old one is pushed to a property called "base"
         * @function
         * @instance
         * @name extend
         * @snippet Utils.extend|Object
        Utils.extend(${1:baseObject}, ${2:extendedObject})
         * @snippet Utils.extend|conflict
Utils.extend(${1:baseObject}, ${2:extendedObject}, false, function (prop) {
    ${4://code here}
});
         * @param {Object} object1 - original object
         * @param {Object} object2 - new object
         * @param {Bool} [force] - Overwrites properties (defaults to false)
         * @param {Function} [onConflict] - Called when properties have the same name. Only called if force is false.
         * @return {Array} The updated array
         */
        extend: extend,
        /**
         * Counts the number of keys in an object literal
         * @function
         * @instance
         * @name getKeyLength
         * @snippet Utils.getKeyLength|Number
        Utils.getKeyLength(${1:object})
         * @param {Object} object - object literal
         * @return {Number} Number of keys
         */
        getKeyLength: getKeyLength,
        /**
         * Returns a (shallow) copy of an object literal
         * @function
         * @instance
         * @name copyObject
         * @snippet Utils.copyObject|Object
        Utils.copyObject(${1:Object})
         * @param {Object} object - object literal
         * @return {Object} Shallow copy
         */
        copyObject: copyObject,
        /**
         * Returns a clone of a JSON object
         * @function
         * @instance
         * @param {Object} jsonObj - Object literal that adheres to JSON standards
         * @name cloneJson
         * @snippet Utils.cloneJson|Object
        Utils.cloneJson(${1:json})
         */
        cloneJson: function (jsonObj) {
            var out;
            try {
                out = JSON.parse(JSON.stringify(jsonObj));
            } catch (e) {
                out = {};
                console.log('WARNING: object cloning failed');
            }
            return out;
        },
        /**
         * Removes entry from array (note: only removes all matching values it finds)
         * @function
         * @instance
         * @param {Array} array - array
         * @param {Anything} value - any type
         * @return {Bool} True if removal was successful, false if the value was not found
         * @name removeFromArray
         * @snippet Utils.removeFromArray|Object
        Utils.removeFromArray(${1:Array}, ${2:Value})
         */
        removeFromArray: removeFromArray,
        /**
         * Checks whether a value is between two other values
         * @function
         * @instance
         * @param {Number} min - lower limit
         * @param {Number} value - value to check that's between min and max
         * @param {Number} max - upper limit
         * @param {Boolean} includeEdge - includes edge values
         * @name isBetween
         * @snippet Utils.isBetween|Boolean
        Utils.isBetween(${1:minimum}, ${2:value}, ${3:maximum}, ${4:false})
         */
        isBetween: function (min, value, max, includeEdge) {
            if (includeEdge) {
                return min <= value && value <= max;
            }
            return min < value && value < max;
        },
        /**
         * Picks one of the parameters of this function and returns it
         * @function
         * @instance
         * @name pickRandom
         * @snippet Utils.pickRandom|Object
        Utils.pickRandom(${1:item1}, ${2:item2}, ${3:...})
         */
        pickRandom: function () {
            return arguments[this.getRandom(arguments.length)];
        },
        //http://javascript.about.com/od/problemsolving/a/modulobug.htm
        /**
         * Modulo that will return in a positive remainder
         * @function
         * @instance
         * @name modulo
         * @snippet Utils.modulo|Number
        Utils.modulo(${1:var1}, ${2:var2})
         */
        modulo: function (b, n) {
            return ((b % n) + n) % n;
        },
        /**
         * Picks one of the items in an Array
         * @function
         * @instance
         * @name pickRandomFrom
         * @param {Array} array
         * @snippet Utils.pickRandomFrom|snippet
        Utils.pickRandomFrom(${1:array})
         */
        pickRandomFrom: function (array) {
            return array[this.getRandom(array.length)];
        },
        /**
         * Clamps a numerical value between a minimum and maximum value
         * @function
         * @instance
         * @param {Number} min - lower limit
         * @param {Number} value - value to clamp between min and max
         * @param {Number} max - upper limit
         * @name clamp
         * @snippet Utils.clamp
        Utils.clamp(${1:min}, ${2:value}, ${3:max})
         */
        clamp: function (min, value, max) {
            return Math.max(min, Math.min(value, max));
        },
        /**
         * Checks useragent if device is an apple device. Works on web only.
         * @function
         * @instance
         * @name isApple
         * @snippet Utils.isApple|Boolean
        Utils.isApple()
         */
        isApple: function () {
            var device = (navigator.userAgent).match(/iPhone|iPad|iPod/i);
            return /iPhone/i.test(device) || /iPad/i.test(device) || /iPod/i.test(device);
        },
        /**
         * Checks useragent if device is an android device. Works on web only.
         * @function
         * @instance
         * @name isAndroid
         * @snippet Utils.isAndroid|Boolean
        Utils.isAndroid()
         */
        isAndroid: function () {
            return /Android/i.test(navigator.userAgent);
        },
        /**
         * Checks if environment is cocoon
         * @function
         * @instance
         * @name isCocoonJs
         * @snippet Utils.isCocoonJs|Boolean
        Utils.isCocoonJs()
         */
        isCocoonJS: function () {
            return navigator.isCocoonJS;
        },
        isCocoonJs: function () {
            return navigator.isCocoonJS;
        },
        /**
         * Checks if environment is mobile browser
         * @function
         * @instance
         * @name isMobileBrowser
         * @snippet Utils.isMobileBrowser|Boolean
        Utils.isMobileBrowser()
         */
        isMobileBrowser: function () {
            var check = false;
            (function (a) {
                if (/(android|bb\d+|meego|android|ipad|playbook|silk).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) {
                    check = true;
                }
            })(navigator.userAgent || navigator.vendor || window.opera);
            return check;
        },
        /**
         * Checks if environment is Android (using Cordova Device plugin)
         * @function
         * @instance
         * @name isAndroidDevice
         * @snippet Utils.isAndroidDevice|Boolean
        Utils.isAndroidDevice()
         */
        isAndroidDevice: function () {
            var platform = window.device && window.device.platform ? window.device.platform.toLowerCase() : '';
            if (platform === 'android') {
                return true;
            }
            return false;
        },
        /**
         * Checks if environment is iOS (using Cordova Device plugin)
         * @function
         * @instance
         * @name isIosDevice
         * @snippet Utils.isIosDevice|Boolean
        Utils.isIosDevice()
         */
        isIosDevice: function () {
            var platform = window.device && window.device.platform ? window.device.platform.toLowerCase() : '';
            if (platform === 'ios') {
                return true;
            }
            return false;
        },
        /**
         * Checks if environment is Amazon/Fire OS (using Cordova Device plugin)
         * @function
         * @instance
         * @name isAmazonDevice
         * @snippet Utils.isAmazonDevice|Boolean
        Utils.isAmazonDevice()
         */
        isAmazonDevice: function () {
            var platform = window.device && window.device.platform ? window.device.platform.toLowerCase() : '';
            // platform can be either 'amazon-fireos' or 'Amazon'
            if (platform.indexOf('amazon') > -1) {
                return true;
            }
            return false;
        },
        /**
         * Turn dev mode on or off to use throws or console.logs
         * @function
         * @instance
         * @param {Boolean} bool - set to true to use throws instead of console.logs
         * @name setDev
         * @snippet Utils.setDev|snippet
        Utils.setDev()
         */
        setDev: function (bool) {
            dev = bool;
        },
        /**
         * Is dev mode on
         * @function
         * @instance
         * @name isDev
         * @snippet Utils.isDev|Boolean
        Utils.isDev()
         */
        isDev: function () {
            return dev;
        },
        /**
         * Wrapper around console.error
         * @function
         * @instance
         * @param {String} msg - the message to log
         * @name log
         * @snippet Utils.log
        Utils.log('WARNING: ${1}')
         */
        log: function (msg) {
            console.error(msg);
        },

        /**
         * Gets a value safely from an object literal without crashing.
         * @example
         * var dataObject = {
         *     users: {
         *         data: [{
         *             value: 1234
         *         }]
         *     }
         * };
         * 
         * Utils.getSafe(dataObject, ['users', 'data', 0, 'value'], null);
         * // or
         * Utils.getSafe(dataObject, 'users.data[0].value', null);
         * 
         * @function
         * @instance
         * @param {Object/Array} dataObject - Data object or array to access
         * @param {Array/String} keys - Array of property keys or formatted as String
         * @param {Value} [defaultValue] - Default value to return if one of the keys does not exist
         * @name getSafe
         * @snippet Utils.getSafe|ByArray
        Utils.getSafe(${1:object}, ['$2'], ${3:defaultValue})
         * @snippet Utils.getSafe|ByString
        Utils.getSafe(${1:object}, '${2}', ${3:defaultValue})
         */
        getSafe: function (object, keys, defaultValue) {
            var emptyObj = {};
            var propertyKeys = keys; // assuming keys = array
            var i, l = propertyKeys.length;
            var value = object;

            // parse keys from string
            if (Utils.isString(propertyKeys)) {
                // remove starting . or [ and trailing ]
                if (keys.startsWith('.')) {
                    keys = keys.slice(1);
                }
                if (keys.startsWith('[')) {
                    keys = keys.slice(1);
                }
                if (keys.endsWith(']')) {
                    keys = keys.slice(0, -1);
                }
                // remove all apastrophes and quotes
                keys = keys.replace(/\'|\"/g, '');

                // split into array by . or ][ or [ or ]. or ]
                propertyKeys = keys.split(/\.|\]\[|\[|\].|\]/);
                l = propertyKeys.length;
            }

            for (i = 0; i < l; ++i) {
                value = value[propertyKeys[i]] || emptyObj;
                // add warnings when property is not found?
            }

            if (value === emptyObj) {
                // failed
                return defaultValue;
            }
            return value;
        },
        /**
         * @function
         * @instance
         * @name isString
         * @snippet Utils.isString|Boolean
        Utils.isString(${1:String})
         */
        isString: isString,
        /**
         * @function
         * @instance
         * @name isArray
         * @snippet Utils.isArray|Boolean
        Utils.isArray(${1:Array})
         */
        isArray: isArray,
        /**
         * @function
         * @instance
         * @name isObject
         * @snippet Utils.isObject|Boolean
        Utils.isObject(${1:Object})
         */
        isObject: isObject,
        /**
         * @function
         * @instance
         * @name isFunction
         * @snippet Utils.isFunction|Boolean
        Utils.isFunction(${1:Function})
         */
        isFunction: isFunction,
        /**
         * @function
         * @instance
         * @name isNumber
         * @snippet Utils.isNumber|Boolean
        Utils.isNumber(${1:Number})
         */
        isNumber: isNumber,
        /**
         * @function
         * @instance
         * @name isBoolean
         * @snippet Utils.isBoolean|Boolean
        Utils.isBoolean(${1:Boolean})
         */
        isBoolean: isBoolean,
        /**
         * @function
         * @instance
         * @name isInt
         * @snippet Utils.isInt|Boolean
        Utils.isInt(${1:Integer})
         */
        isInt: isInt,
        /**
         * Is parameter undefined?
         * @function
         * @name isUndefined
         * @snippet Utils.isUndefined|Boolean
        Utils.isUndefined(${1})
         * @param {Anything} obj - any type
         * @return {Bool} True if parameter is undefined
         * @instance
         */
        isUndefined: isUndefined,
        /**
         * Is parameter anything other than undefined?
         * @function
         * @instance
         * @param {Anything} obj - any type
         * @return {Bool} True if parameter is not undefined
         * @name isDefined
         * @snippet Utils.isDefined|Boolean
        Utils.isDefined(${1})
         */
        isDefined: isDefined,
        /**
         * Is parameter null or undefined
         * @function
         * @instance
         * @param {Anything} obj - any type
         * @return {Bool} True if parameter is null or undefined
         * @name isEmpty
         * @snippet Utils.isEmpty|Boolean
        Utils.isEmpty(${1})
         */
        isEmpty: isEmpty,
        /**
         * Is parameter anything other than null or undefined
         * @function
         * @instance
         * @param {Anything} obj - any type
         * @return {Bool} True if parameter is not null or undefined
         * @name isNotEmpty
         * @snippet Utils.isNotEmpty|Boolean
        Utils.isNotEmpty(${1})
         */
        isNotEmpty: isNotEmpty,
        stableSort: stableSort,
        keyboardMapping: keyboardMapping,
        remoteMapping: remoteMapping,
        gamepadMapping: gamepadMapping,
        /**
         * Enum for sort mode, pass this to Bento.setup
         * @readonly
         * @enum {Number}
         */
        SortMode: {
            ALWAYS: 0,
            NEVER: 1,
            SORT_ON_ADD: 2
        }
    };
    return Utils;
});