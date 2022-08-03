
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function onInterval(callback, milliseconds) {
        const interval = setInterval(callback, milliseconds);

        onDestroy(() => {
            clearInterval(interval);
        });
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const test= writable(0);
    const ballSlot1=writable(true);
    const ballSlot2=writable(true);
    const ballSlot3=writable(true);
    const ballSlot4=writable(true);
    const intake= writable({ x1: 0, x2: 0, x3: 0, x4:0, y1: 0, y2: 0, y3: 0, y4: 0});

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function tick_spring(ctx, last_value, current_value, target_value) {
        if (typeof current_value === 'number' || is_date(current_value)) {
            // @ts-ignore
            const delta = target_value - current_value;
            // @ts-ignore
            const velocity = (current_value - last_value) / (ctx.dt || 1 / 60); // guard div by 0
            const spring = ctx.opts.stiffness * delta;
            const damper = ctx.opts.damping * velocity;
            const acceleration = (spring - damper) * ctx.inv_mass;
            const d = (velocity + acceleration) * ctx.dt;
            if (Math.abs(d) < ctx.opts.precision && Math.abs(delta) < ctx.opts.precision) {
                return target_value; // settled
            }
            else {
                ctx.settled = false; // signal loop to keep ticking
                // @ts-ignore
                return is_date(current_value) ?
                    new Date(current_value.getTime() + d) : current_value + d;
            }
        }
        else if (Array.isArray(current_value)) {
            // @ts-ignore
            return current_value.map((_, i) => tick_spring(ctx, last_value[i], current_value[i], target_value[i]));
        }
        else if (typeof current_value === 'object') {
            const next_value = {};
            for (const k in current_value) {
                // @ts-ignore
                next_value[k] = tick_spring(ctx, last_value[k], current_value[k], target_value[k]);
            }
            // @ts-ignore
            return next_value;
        }
        else {
            throw new Error(`Cannot spring ${typeof current_value} values`);
        }
    }
    function spring(value, opts = {}) {
        const store = writable(value);
        const { stiffness = 0.15, damping = 0.8, precision = 0.01 } = opts;
        let last_time;
        let task;
        let current_token;
        let last_value = value;
        let target_value = value;
        let inv_mass = 1;
        let inv_mass_recovery_rate = 0;
        let cancel_task = false;
        function set(new_value, opts = {}) {
            target_value = new_value;
            const token = current_token = {};
            if (value == null || opts.hard || (spring.stiffness >= 1 && spring.damping >= 1)) {
                cancel_task = true; // cancel any running animation
                last_time = now();
                last_value = new_value;
                store.set(value = target_value);
                return Promise.resolve();
            }
            else if (opts.soft) {
                const rate = opts.soft === true ? .5 : +opts.soft;
                inv_mass_recovery_rate = 1 / (rate * 60);
                inv_mass = 0; // infinite mass, unaffected by spring forces
            }
            if (!task) {
                last_time = now();
                cancel_task = false;
                task = loop(now => {
                    if (cancel_task) {
                        cancel_task = false;
                        task = null;
                        return false;
                    }
                    inv_mass = Math.min(inv_mass + inv_mass_recovery_rate, 1);
                    const ctx = {
                        inv_mass,
                        opts: spring,
                        settled: true,
                        dt: (now - last_time) * 60 / 1000
                    };
                    const next_value = tick_spring(ctx, last_value, value, target_value);
                    last_time = now;
                    last_value = value;
                    store.set(value = next_value);
                    if (ctx.settled) {
                        task = null;
                    }
                    return !ctx.settled;
                });
            }
            return new Promise(fulfil => {
                task.promise.then(() => {
                    if (token === current_token)
                        fulfil();
                });
            });
        }
        const spring = {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe,
            stiffness,
            damping,
            precision
        };
        return spring;
    }

    /* src\ShotCargo.svelte generated by Svelte v3.48.0 */
    const file$3 = "src\\ShotCargo.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let svg;
    	let circle;
    	let svg_width_value;
    	let svg_height_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			attr_dev(circle, "cx", "60");
    			attr_dev(circle, "cy", "60.834");
    			attr_dev(circle, "r", "55");
    			set_style(circle, "fill", "red");
    			add_location(circle, file$3, 67, 0, 2190);
    			attr_dev(svg, "id", "Layer_1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "width", svg_width_value = "" + (/*ballSize*/ ctx[2] + "px"));
    			attr_dev(svg, "height", svg_height_value = "" + (/*ballSize*/ ctx[2] + "px"));
    			attr_dev(svg, "viewBox", "0 0 120 120");
    			attr_dev(svg, "enable-background", "new 0 0 120 120");
    			attr_dev(svg, "xml:space", "preserve");
    			add_location(svg, file$3, 65, 0, 1964);
    			attr_dev(div, "class", "fixed");
    			set_style(div, "transform", "translate(" + /*drawX*/ ctx[0] + "px," + /*drawY*/ ctx[1] + "px)");
    			add_location(div, file$3, 62, 0, 1888);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, circle);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*ballSize*/ 4 && svg_width_value !== (svg_width_value = "" + (/*ballSize*/ ctx[2] + "px"))) {
    				attr_dev(svg, "width", svg_width_value);
    			}

    			if (dirty & /*ballSize*/ 4 && svg_height_value !== (svg_height_value = "" + (/*ballSize*/ ctx[2] + "px"))) {
    				attr_dev(svg, "height", svg_height_value);
    			}

    			if (dirty & /*drawX, drawY*/ 3) {
    				set_style(div, "transform", "translate(" + /*drawX*/ ctx[0] + "px," + /*drawY*/ ctx[1] + "px)");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $ballSlot4;
    	let $ballSlot3;
    	let $ballSlot2;
    	let $ballSlot1;
    	validate_store(ballSlot4, 'ballSlot4');
    	component_subscribe($$self, ballSlot4, $$value => $$invalidate(10, $ballSlot4 = $$value));
    	validate_store(ballSlot3, 'ballSlot3');
    	component_subscribe($$self, ballSlot3, $$value => $$invalidate(11, $ballSlot3 = $$value));
    	validate_store(ballSlot2, 'ballSlot2');
    	component_subscribe($$self, ballSlot2, $$value => $$invalidate(12, $ballSlot2 = $$value));
    	validate_store(ballSlot1, 'ballSlot1');
    	component_subscribe($$self, ballSlot1, $$value => $$invalidate(13, $ballSlot1 = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ShotCargo', slots, []);
    	let { startX = 0 } = $$props;
    	let { startY = 0 } = $$props;
    	let { endX = 0 } = $$props;
    	let { endY = 0 } = $$props;
    	let { miss } = $$props;
    	let { ballSlot } = $$props;
    	let drawX = 0;
    	let drawY = 0;
    	startX = startX;
    	startY = startY;
    	endX = endX + (Math.random() - 0.5) * 2 * 50;
    	endY = endY + (Math.random() - 0.5) * 2 * 50;
    	let lengthX = Math.abs(endX - startX);
    	let lengthY = Math.abs(endY - startY);
    	let lengthHype = Math.sqrt(lengthX ** 2 + lengthY ** 2);
    	let angle = Math.atan2(endY - startY, endX - startX);
    	let milliCount = 0;
    	let minBallSize = 55, maxBallSize = 90, endBallSize = 60;
    	let ballSize = minBallSize;
    	const countUp = () => $$invalidate(9, milliCount += 1.8);
    	onInterval(countUp, 1);

    	function move() {
    		if (milliCount <= lengthHype) {
    			if (milliCount <= lengthHype / 2) {
    				$$invalidate(2, ballSize = milliCount / (lengthHype / 2) * (maxBallSize - minBallSize) + minBallSize);
    			}

    			if (milliCount > lengthHype / 2) {
    				$$invalidate(2, ballSize = maxBallSize - (milliCount - lengthHype / 2) / (lengthHype / 2) * (maxBallSize - minBallSize));
    			}

    			$$invalidate(0, drawX = Math.cos(angle) * milliCount + startX);
    			$$invalidate(1, drawY = Math.sin(angle) * milliCount + startY);
    			$$invalidate(0, drawX = drawX - ballSize / 2);
    			$$invalidate(1, drawY = drawY - ballSize / 2);
    			return;
    		}

    		switch (ballSlot) {
    			case 1:
    				set_store_value(ballSlot1, $ballSlot1 = true, $ballSlot1);
    				break;
    			case 2:
    				set_store_value(ballSlot2, $ballSlot2 = true, $ballSlot2);
    				break;
    			case 3:
    				set_store_value(ballSlot3, $ballSlot3 = true, $ballSlot3);
    				break;
    			case 4:
    				set_store_value(ballSlot4, $ballSlot4 = true, $ballSlot4);
    				break;
    		}
    	}

    	const writable_props = ['startX', 'startY', 'endX', 'endY', 'miss', 'ballSlot'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ShotCargo> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('startX' in $$props) $$invalidate(3, startX = $$props.startX);
    		if ('startY' in $$props) $$invalidate(4, startY = $$props.startY);
    		if ('endX' in $$props) $$invalidate(5, endX = $$props.endX);
    		if ('endY' in $$props) $$invalidate(6, endY = $$props.endY);
    		if ('miss' in $$props) $$invalidate(7, miss = $$props.miss);
    		if ('ballSlot' in $$props) $$invalidate(8, ballSlot = $$props.ballSlot);
    	};

    	$$self.$capture_state = () => ({
    		writable,
    		onInterval,
    		ballSlot1,
    		ballSlot2,
    		ballSlot4,
    		ballSlot3,
    		startX,
    		startY,
    		endX,
    		endY,
    		miss,
    		ballSlot,
    		drawX,
    		drawY,
    		lengthX,
    		lengthY,
    		lengthHype,
    		angle,
    		milliCount,
    		minBallSize,
    		maxBallSize,
    		endBallSize,
    		ballSize,
    		countUp,
    		move,
    		$ballSlot4,
    		$ballSlot3,
    		$ballSlot2,
    		$ballSlot1
    	});

    	$$self.$inject_state = $$props => {
    		if ('startX' in $$props) $$invalidate(3, startX = $$props.startX);
    		if ('startY' in $$props) $$invalidate(4, startY = $$props.startY);
    		if ('endX' in $$props) $$invalidate(5, endX = $$props.endX);
    		if ('endY' in $$props) $$invalidate(6, endY = $$props.endY);
    		if ('miss' in $$props) $$invalidate(7, miss = $$props.miss);
    		if ('ballSlot' in $$props) $$invalidate(8, ballSlot = $$props.ballSlot);
    		if ('drawX' in $$props) $$invalidate(0, drawX = $$props.drawX);
    		if ('drawY' in $$props) $$invalidate(1, drawY = $$props.drawY);
    		if ('lengthX' in $$props) lengthX = $$props.lengthX;
    		if ('lengthY' in $$props) lengthY = $$props.lengthY;
    		if ('lengthHype' in $$props) lengthHype = $$props.lengthHype;
    		if ('angle' in $$props) angle = $$props.angle;
    		if ('milliCount' in $$props) $$invalidate(9, milliCount = $$props.milliCount);
    		if ('minBallSize' in $$props) minBallSize = $$props.minBallSize;
    		if ('maxBallSize' in $$props) maxBallSize = $$props.maxBallSize;
    		if ('endBallSize' in $$props) endBallSize = $$props.endBallSize;
    		if ('ballSize' in $$props) $$invalidate(2, ballSize = $$props.ballSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*milliCount*/ 512) {
    			{
    				move();
    			}
    		}
    	};

    	return [drawX, drawY, ballSize, startX, startY, endX, endY, miss, ballSlot, milliCount];
    }

    class ShotCargo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			startX: 3,
    			startY: 4,
    			endX: 5,
    			endY: 6,
    			miss: 7,
    			ballSlot: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ShotCargo",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*miss*/ ctx[7] === undefined && !('miss' in props)) {
    			console.warn("<ShotCargo> was created without expected prop 'miss'");
    		}

    		if (/*ballSlot*/ ctx[8] === undefined && !('ballSlot' in props)) {
    			console.warn("<ShotCargo> was created without expected prop 'ballSlot'");
    		}
    	}

    	get startX() {
    		throw new Error("<ShotCargo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set startX(value) {
    		throw new Error("<ShotCargo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get startY() {
    		throw new Error("<ShotCargo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set startY(value) {
    		throw new Error("<ShotCargo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get endX() {
    		throw new Error("<ShotCargo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set endX(value) {
    		throw new Error("<ShotCargo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get endY() {
    		throw new Error("<ShotCargo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set endY(value) {
    		throw new Error("<ShotCargo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get miss() {
    		throw new Error("<ShotCargo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set miss(value) {
    		throw new Error("<ShotCargo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ballSlot() {
    		throw new Error("<ShotCargo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ballSlot(value) {
    		throw new Error("<ShotCargo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Cargo.svelte generated by Svelte v3.48.0 */

    const { console: console_1 } = globals;
    const file$2 = "src\\Cargo.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let svg;
    	let circle;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			attr_dev(circle, "cx", "60");
    			attr_dev(circle, "cy", "60.834");
    			attr_dev(circle, "r", /*ballSize*/ ctx[1]);
    			set_style(circle, "fill", "red");
    			add_location(circle, file$2, 51, 0, 1618);
    			attr_dev(svg, "id", "Layer_1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "width", "" + (/*ballSize*/ ctx[1] + "px"));
    			attr_dev(svg, "height", "" + (/*ballSize*/ ctx[1] + "px"));
    			attr_dev(svg, "viewBox", "0 0 120 120");
    			attr_dev(svg, "enable-background", "new 0 0 120 120");
    			attr_dev(svg, "xml:space", "preserve");
    			add_location(svg, file$2, 49, 4, 1388);
    			attr_dev(div, "class", "fixed");
    			set_style(div, "transform", "translate(" + (/*coords*/ ctx[0][0] - /*ballSize*/ ctx[1] / 2) + "px," + (/*coords*/ ctx[0][1] - /*ballSize*/ ctx[1] / 2) + "px)");
    			add_location(div, file$2, 46, 0, 1278);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, circle);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*coords*/ 1) {
    				set_style(div, "transform", "translate(" + (/*coords*/ ctx[0][0] - /*ballSize*/ ctx[1] / 2) + "px," + (/*coords*/ ctx[0][1] - /*ballSize*/ ctx[1] / 2) + "px)");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function inside(point, vs) {
    	// ray-casting algorithm based on
    	// https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
    	let x = point[0], y = point[1];

    	let inside = false;

    	for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    		let xi = vs[i][0], yi = vs[i][1];
    		let xj = vs[j][0], yj = vs[j][1];
    		let intersect = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
    		if (intersect) inside = !inside;
    	}

    	return inside;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $intake;
    	validate_store(intake, 'intake');
    	component_subscribe($$self, intake, $$value => $$invalidate(4, $intake = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Cargo', slots, []);
    	let { coords } = $$props;
    	console.log(coords);
    	let milliCount = 0;
    	let ballSize = 55;
    	const countUp = () => $$invalidate(2, milliCount += 1.8);
    	let insideIntake = false;
    	onInterval(countUp, 1);

    	function checkInside() {
    		let polygon = [
    			[$intake.x1 - ballSize / 2, $intake.y1 - ballSize / 2],
    			[$intake.x2 + ballSize / 2, $intake.y2 - ballSize / 2],
    			[$intake.x3 + ballSize / 2, $intake.y3],
    			[$intake.x4 - ballSize / 2, $intake.y4]
    		];

    		insideIntake = inside(coords, polygon);
    		console.log(insideIntake);
    	}

    	const writable_props = ['coords'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Cargo> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('coords' in $$props) $$invalidate(0, coords = $$props.coords);
    	};

    	$$self.$capture_state = () => ({
    		onInterval,
    		intake,
    		coords,
    		milliCount,
    		ballSize,
    		countUp,
    		insideIntake,
    		checkInside,
    		inside,
    		$intake
    	});

    	$$self.$inject_state = $$props => {
    		if ('coords' in $$props) $$invalidate(0, coords = $$props.coords);
    		if ('milliCount' in $$props) $$invalidate(2, milliCount = $$props.milliCount);
    		if ('ballSize' in $$props) $$invalidate(1, ballSize = $$props.ballSize);
    		if ('insideIntake' in $$props) insideIntake = $$props.insideIntake;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*milliCount*/ 4) {
    			{
    				checkInside();
    			}
    		}
    	};

    	return [coords, ballSize, milliCount];
    }

    class Cargo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { coords: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cargo",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*coords*/ ctx[0] === undefined && !('coords' in props)) {
    			console_1.warn("<Cargo> was created without expected prop 'coords'");
    		}
    	}

    	get coords() {
    		throw new Error("<Cargo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set coords(value) {
    		throw new Error("<Cargo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function styleInject(css, ref) {
      if ( ref === void 0 ) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') { return; }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css_248z$1 = ".box.svelte-1fgtq5x{--width:130px;--height:130px;position:fixed;width:var(--width);height:var(--height);border-radius:4px;background-color:#ff3e00}";
    styleInject(css_248z$1);

    /* src\Robot.svelte generated by Svelte v3.48.0 */

    const { window: window_1 } = globals;
    const file$1 = "src\\Robot.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[47] = list[i];
    	return child_ctx;
    }

    // (307:0) {#each floorBalls as ball}
    function create_each_block(ctx) {
    	let cargo;
    	let current;

    	cargo = new Cargo({
    			props: { coords: /*ball*/ ctx[47] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(cargo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cargo, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cargo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cargo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cargo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(307:0) {#each floorBalls as ball}",
    		ctx
    	});

    	return block;
    }

    // (312:0) {#if !$ballSlot1}
    function create_if_block_3(ctx) {
    	let shotcargo;
    	let current;

    	shotcargo = new ShotCargo({
    			props: {
    				startX: /*$ball1Coords*/ ctx[6].x,
    				startY: /*$ball1Coords*/ ctx[6].y,
    				endX: /*$centerCoords*/ ctx[7].x,
    				endY: /*$centerCoords*/ ctx[7].y,
    				miss: false,
    				ballSlot: 1
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shotcargo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(shotcargo, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const shotcargo_changes = {};
    			if (dirty[0] & /*$ball1Coords*/ 64) shotcargo_changes.startX = /*$ball1Coords*/ ctx[6].x;
    			if (dirty[0] & /*$ball1Coords*/ 64) shotcargo_changes.startY = /*$ball1Coords*/ ctx[6].y;
    			if (dirty[0] & /*$centerCoords*/ 128) shotcargo_changes.endX = /*$centerCoords*/ ctx[7].x;
    			if (dirty[0] & /*$centerCoords*/ 128) shotcargo_changes.endY = /*$centerCoords*/ ctx[7].y;
    			shotcargo.$set(shotcargo_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shotcargo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shotcargo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shotcargo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(312:0) {#if !$ballSlot1}",
    		ctx
    	});

    	return block;
    }

    // (315:0) {#if !$ballSlot2}
    function create_if_block_2(ctx) {
    	let shotcargo;
    	let current;

    	shotcargo = new ShotCargo({
    			props: {
    				startX: /*$ball2Coords*/ ctx[8].x,
    				startY: /*$ball2Coords*/ ctx[8].y,
    				endX: /*$centerCoords*/ ctx[7].x,
    				endY: /*$centerCoords*/ ctx[7].y,
    				miss: false,
    				ballSlot: 2
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shotcargo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(shotcargo, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const shotcargo_changes = {};
    			if (dirty[0] & /*$ball2Coords*/ 256) shotcargo_changes.startX = /*$ball2Coords*/ ctx[8].x;
    			if (dirty[0] & /*$ball2Coords*/ 256) shotcargo_changes.startY = /*$ball2Coords*/ ctx[8].y;
    			if (dirty[0] & /*$centerCoords*/ 128) shotcargo_changes.endX = /*$centerCoords*/ ctx[7].x;
    			if (dirty[0] & /*$centerCoords*/ 128) shotcargo_changes.endY = /*$centerCoords*/ ctx[7].y;
    			shotcargo.$set(shotcargo_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shotcargo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shotcargo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shotcargo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(315:0) {#if !$ballSlot2}",
    		ctx
    	});

    	return block;
    }

    // (318:0) {#if !$ballSlot3}
    function create_if_block_1(ctx) {
    	let shotcargo;
    	let current;

    	shotcargo = new ShotCargo({
    			props: {
    				startX: /*$ball3Coords*/ ctx[9].x,
    				startY: /*$ball3Coords*/ ctx[9].y,
    				endX: /*$centerCoords*/ ctx[7].x,
    				endY: /*$centerCoords*/ ctx[7].y,
    				miss: false,
    				ballSlot: 3
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shotcargo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(shotcargo, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const shotcargo_changes = {};
    			if (dirty[0] & /*$ball3Coords*/ 512) shotcargo_changes.startX = /*$ball3Coords*/ ctx[9].x;
    			if (dirty[0] & /*$ball3Coords*/ 512) shotcargo_changes.startY = /*$ball3Coords*/ ctx[9].y;
    			if (dirty[0] & /*$centerCoords*/ 128) shotcargo_changes.endX = /*$centerCoords*/ ctx[7].x;
    			if (dirty[0] & /*$centerCoords*/ 128) shotcargo_changes.endY = /*$centerCoords*/ ctx[7].y;
    			shotcargo.$set(shotcargo_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shotcargo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shotcargo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shotcargo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(318:0) {#if !$ballSlot3}",
    		ctx
    	});

    	return block;
    }

    // (321:0) {#if !$ballSlot4}
    function create_if_block(ctx) {
    	let shotcargo;
    	let current;

    	shotcargo = new ShotCargo({
    			props: {
    				startX: /*$ball4Coords*/ ctx[10].x,
    				startY: /*$ball4Coords*/ ctx[10].y,
    				endX: /*$centerCoords*/ ctx[7].x,
    				endY: /*$centerCoords*/ ctx[7].y,
    				miss: false,
    				ballSlot: 4
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shotcargo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(shotcargo, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const shotcargo_changes = {};
    			if (dirty[0] & /*$ball4Coords*/ 1024) shotcargo_changes.startX = /*$ball4Coords*/ ctx[10].x;
    			if (dirty[0] & /*$ball4Coords*/ 1024) shotcargo_changes.startY = /*$ball4Coords*/ ctx[10].y;
    			if (dirty[0] & /*$centerCoords*/ 128) shotcargo_changes.endX = /*$centerCoords*/ ctx[7].x;
    			if (dirty[0] & /*$centerCoords*/ 128) shotcargo_changes.endY = /*$centerCoords*/ ctx[7].y;
    			shotcargo.$set(shotcargo_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shotcargo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shotcargo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shotcargo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(321:0) {#if !$ballSlot4}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div0;
    	let t0_value = Math.atan2(window.innerHeight / 2 - /*$coords*/ ctx[2].y - 50, window.innerWidth / 2 - /*$coords*/ ctx[2].x - 50) * (180 / Math.PI) + 90 + "";
    	let t0;
    	let t1;
    	let t2_value = window.innerWidth + "";
    	let t2;
    	let t3;
    	let t4_value = window.innerHeight + "";
    	let t4;
    	let t5;
    	let div1;
    	let svg0;
    	let path0;
    	let t6;
    	let intake_1;
    	let svg1;
    	let path1;
    	let t7;
    	let t8;
    	let t9;
    	let t10;
    	let t11;
    	let if_block3_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*floorBalls*/ ctx[16];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block0 = !/*$ballSlot1*/ ctx[5] && create_if_block_3(ctx);
    	let if_block1 = !/*$ballSlot2*/ ctx[4] && create_if_block_2(ctx);
    	let if_block2 = !/*$ballSlot3*/ ctx[3] && create_if_block_1(ctx);
    	let if_block3 = !/*$ballSlot4*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			t4 = text(t4_value);
    			t5 = space();
    			div1 = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t6 = space();
    			intake_1 = element("intake");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t7 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			if (if_block0) if_block0.c();
    			t9 = space();
    			if (if_block1) if_block1.c();
    			t10 = space();
    			if (if_block2) if_block2.c();
    			t11 = space();
    			if (if_block3) if_block3.c();
    			if_block3_anchor = empty();
    			attr_dev(div0, "class", "fixed z-40");
    			add_location(div0, file$1, 284, 0, 8347);
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "d", "M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z");
    			add_location(path0, file$1, 295, 8, 8988);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "class", "h-[90px] fixed");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "stroke", "white");
    			attr_dev(svg0, "stroke-width", "2");
    			set_style(svg0, "transform", "rotate(" + (/*rot*/ ctx[0] * -1 + Math.atan2(window.innerHeight / 2 - /*$coords*/ ctx[2].y - 50, window.innerWidth / 2 - /*$coords*/ ctx[2].x - 50) * (180 / Math.PI) + 90) + "deg)");
    			add_location(svg0, file$1, 294, 4, 8707);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "d", "M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z");
    			add_location(path1, file$1, 300, 8, 9311);
    			attr_dev(svg1, "id", "intake");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "class", "fixed -mt-[158px] w-[160px] -ml-[80px]");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "stroke", "white");
    			attr_dev(svg1, "stroke-width", "2");
    			add_location(svg1, file$1, 299, 4, 9138);
    			add_location(intake_1, file$1, 298, 4, 9124);
    			attr_dev(div1, "class", "box grid h-screen place-items-center svelte-1fgtq5x");
    			attr_dev(div1, "id", "robot");
    			set_style(div1, "transform", "translate(" + (/*$coords*/ ctx[2].x - 65) + "px," + (/*$coords*/ ctx[2].y - 65) + "px) rotate(" + /*rot*/ ctx[0] + "deg)");
    			add_location(div1, file$1, 290, 0, 8545);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, svg0);
    			append_dev(svg0, path0);
    			append_dev(div1, t6);
    			append_dev(div1, intake_1);
    			append_dev(intake_1, svg1);
    			append_dev(svg1, path1);
    			insert_dev(target, t7, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t8, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t9, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t10, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t11, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, if_block3_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window_1, "keydown", /*on_key_down*/ ctx[18], false, false, false),
    					listen_dev(window_1, "keyup", /*on_key_up*/ ctx[19], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*$coords*/ 4) && t0_value !== (t0_value = Math.atan2(window.innerHeight / 2 - /*$coords*/ ctx[2].y - 50, window.innerWidth / 2 - /*$coords*/ ctx[2].x - 50) * (180 / Math.PI) + 90 + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty[0] & /*rot, $coords*/ 5) {
    				set_style(svg0, "transform", "rotate(" + (/*rot*/ ctx[0] * -1 + Math.atan2(window.innerHeight / 2 - /*$coords*/ ctx[2].y - 50, window.innerWidth / 2 - /*$coords*/ ctx[2].x - 50) * (180 / Math.PI) + 90) + "deg)");
    			}

    			if (!current || dirty[0] & /*$coords, rot*/ 5) {
    				set_style(div1, "transform", "translate(" + (/*$coords*/ ctx[2].x - 65) + "px," + (/*$coords*/ ctx[2].y - 65) + "px) rotate(" + /*rot*/ ctx[0] + "deg)");
    			}

    			if (dirty[0] & /*floorBalls*/ 65536) {
    				each_value = /*floorBalls*/ ctx[16];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(t8.parentNode, t8);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!/*$ballSlot1*/ ctx[5]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*$ballSlot1*/ 32) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t9.parentNode, t9);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!/*$ballSlot2*/ ctx[4]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*$ballSlot2*/ 16) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t10.parentNode, t10);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!/*$ballSlot3*/ ctx[3]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*$ballSlot3*/ 8) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(t11.parentNode, t11);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (!/*$ballSlot4*/ ctx[1]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*$ballSlot4*/ 2) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(if_block3_anchor.parentNode, if_block3_anchor);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t7);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t8);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t9);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t10);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t11);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(if_block3_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function checkMoveValid(x, y) {
    	// console.log(Math.sqrt(Math.abs(window.innerWidth/2 - x-65) ** 2 + Math.abs(window.innerHeight/2 - y-65) ** 2))
    	return Math.sqrt(Math.abs(window.innerWidth / 2 - x) ** 2 + Math.abs(window.innerHeight / 2 - y) ** 2) >= 180;
    }

    function rotate(cx, cy, x, y, angle) {
    	let radians = Math.PI / 180 * angle,
    		cos = Math.cos(radians),
    		sin = Math.sin(radians),
    		nx = cos * (x - cx) + sin * (y - cy) + cx,
    		ny = cos * (y - cy) - sin * (x - cx) + cy;

    	return [nx, ny];
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $ballSlot4;
    	let $coords;
    	let $ballSlot3;
    	let $ballSlot2;
    	let $ballSlot1;
    	let $ball1Coords;
    	let $centerCoords;
    	let $ball2Coords;
    	let $ball3Coords;
    	let $ball4Coords;
    	validate_store(ballSlot4, 'ballSlot4');
    	component_subscribe($$self, ballSlot4, $$value => $$invalidate(1, $ballSlot4 = $$value));
    	validate_store(ballSlot3, 'ballSlot3');
    	component_subscribe($$self, ballSlot3, $$value => $$invalidate(3, $ballSlot3 = $$value));
    	validate_store(ballSlot2, 'ballSlot2');
    	component_subscribe($$self, ballSlot2, $$value => $$invalidate(4, $ballSlot2 = $$value));
    	validate_store(ballSlot1, 'ballSlot1');
    	component_subscribe($$self, ballSlot1, $$value => $$invalidate(5, $ballSlot1 = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Robot', slots, []);
    	let key;
    	let x = 100;
    	let y = 100;
    	let speedModifier = 0.3;

    	let wDown = false,
    		aDown = false,
    		sDown = false,
    		dDown = false,
    		jDown = false,
    		lDown = false,
    		spaceDown = false;

    	let yValue = 0, xValue = 0;
    	const coords = writable({ x, y });
    	validate_store(coords, 'coords');
    	component_subscribe($$self, coords, value => $$invalidate(2, $coords = value));
    	let ball1Coords = writable({ x: 0, y: 0 });
    	validate_store(ball1Coords, 'ball1Coords');
    	component_subscribe($$self, ball1Coords, value => $$invalidate(6, $ball1Coords = value));
    	let ball2Coords = writable({ x: 0, y: 0 });
    	validate_store(ball2Coords, 'ball2Coords');
    	component_subscribe($$self, ball2Coords, value => $$invalidate(8, $ball2Coords = value));
    	let ball3Coords = writable({ x: 0, y: 0 });
    	validate_store(ball3Coords, 'ball3Coords');
    	component_subscribe($$self, ball3Coords, value => $$invalidate(9, $ball3Coords = value));
    	let ball4Coords = writable({ x: 0, y: 0 });
    	validate_store(ball4Coords, 'ball4Coords');
    	component_subscribe($$self, ball4Coords, value => $$invalidate(10, $ball4Coords = value));
    	let floorBalls = [[500, 200]];

    	let centerCoords = writable({
    		x: window.innerWidth / 2,
    		y: window.innerHeight / 2
    	});

    	validate_store(centerCoords, 'centerCoords');
    	component_subscribe($$self, centerCoords, value => $$invalidate(7, $centerCoords = value));
    	let maxYAcc = 100, maxXAcc = 100;

    	let maxRotAcc = 8,
    		maxRotSpeed = 700,
    		rotAcc = 0,
    		rot = 0,
    		rotDecay = 0.3,
    		rotPace = 0.5;

    	let yDecay = 1, xDecay = 1;
    	let milliCount = 0;
    	const countUp = () => $$invalidate(20, milliCount += 1);
    	onInterval(countUp, 15);

    	function calcRotation() {
    		if (jDown) {
    			if (rotAcc - rotPace >= maxRotAcc * -1) {
    				rotAcc -= rotPace;
    			}
    		}

    		if (lDown) {
    			if (rotAcc + rotPace <= maxRotAcc) {
    				rotAcc += rotPace;
    			}
    		}

    		if (Math.abs(rotAcc) < rotDecay) {
    			rotAcc = 0;
    		}

    		if (rotAcc > 0) {
    			rotAcc -= rotDecay;
    		}

    		if (rotAcc < 0) {
    			rotAcc += rotDecay;
    		}

    		$$invalidate(0, rot += rotAcc);
    	}

    	function calcMovement() {
    		let xPlacement = $coords.x > window.innerWidth / 2;
    		let yPlacement = $coords.y > window.innerHeight / 2;

    		if (!checkMoveValid($coords.x, $coords.y)) {
    			coords.update($coords => ({
    				x: xPlacement ? $coords.x + 10 : $coords.x - 10,
    				y: yPlacement ? $coords.y + 10 : $coords.y
    			}));
    		}

    		if (wDown) {
    			if (yValue + 2.5 <= maxYAcc) {
    				yValue += 2.5;
    			}
    		}

    		if (sDown) {
    			if (yValue - 2.5 >= maxYAcc * -1) {
    				yValue -= 2.5;
    			}
    		}

    		if (aDown) {
    			if (xValue - 2.5 >= maxXAcc * -1) {
    				xValue -= 2.5;
    			}
    		}

    		if (dDown) {
    			if (xValue + 2.5 <= maxXAcc) {
    				xValue += 2.5;
    			}
    		}

    		if (Math.abs(yValue) < yDecay) {
    			yValue = 0;
    		}

    		if (Math.abs(xValue) < xDecay) {
    			xValue = 0;
    		}

    		if (yValue > 0) {
    			yValue -= yDecay;
    		}

    		if (yValue < 0) {
    			yValue += yDecay;
    		}

    		if (xValue > 0) {
    			xValue -= xDecay;
    		}

    		if (xValue < 0) {
    			xValue += xDecay;
    		}

    		x += xValue * speedModifier;
    		y -= yValue * speedModifier;

    		if (x > window.innerWidth - 65) {
    			x = window.innerWidth - 65;
    		}

    		if (y > window.innerHeight - 65) {
    			y = window.innerHeight - 65;
    		}

    		if (x - 65 < 0) {
    			x = 65;
    		}

    		if (y - 65 < 0) {
    			y = 65;
    		}

    		let xValid = false, yValid = false;

    		if (checkMoveValid($coords.x, y)) {
    			xValid = true;
    		}

    		if (checkMoveValid(x, $coords.y)) {
    			yValid = true;
    		}

    		if (!checkMoveValid(x, y)) {
    			xValid = false;
    			yValid = false;
    		}

    		coords.update($coords => ({
    			x: xValid ? x : $coords.x,
    			y: yValid ? y : $coords.y
    		}));

    		if (!xValid) {
    			xValue = 0;
    		}

    		if (!yValid) {
    			yValue = 0;
    		}

    		x = $coords.x;
    		y = $coords.y;
    	}

    	function manageIntake() {
    		intake.update($intake => ({
    			x1: rotate($coords.x, $coords.y, $coords.x - 60, $coords.y - 120, rot * -1)[0],
    			y1: rotate($coords.x, $coords.y, $coords.x - 60, $coords.y - 120, rot * -1)[1],
    			x2: rotate($coords.x, $coords.y, $coords.x + 60, $coords.y - 120, rot * -1)[0],
    			y2: rotate($coords.x, $coords.y, $coords.x + 60, $coords.y - 120, rot * -1)[1],
    			x3: rotate($coords.x, $coords.y, $coords.x + 60, $coords.y - 65, rot * -1)[0],
    			y3: rotate($coords.x, $coords.y, $coords.x + 60, $coords.y - 65, rot * -1)[1],
    			x4: rotate($coords.x, $coords.y, $coords.x - 60, $coords.y - 65, rot * -1)[0],
    			y4: rotate($coords.x, $coords.y, $coords.x - 60, $coords.y - 65, rot * -1)[1]
    		}));
    	}

    	function on_key_down(event) {
    		// if (event.repeat) return;
    		switch (event.key) {
    			case "w":
    				wDown = true;
    				event.preventDefault();
    				break;
    			case "a":
    				aDown = true;
    				event.preventDefault();
    				break;
    			case "s":
    				sDown = true;
    				event.preventDefault();
    				break;
    			case "d":
    				dDown = true;
    				event.preventDefault();
    				break;
    			case "j":
    				jDown = true;
    				event.preventDefault();
    				break;
    			case "l":
    				lDown = true;
    				event.preventDefault();
    				break;
    			case "i":
    				spaceDown = true;
    				event.preventDefault();
    				break;
    		}
    	}

    	function on_key_up(event) {
    		// if (event.repeat) return;
    		switch (event.key) {
    			case "w":
    				wDown = false;
    				event.preventDefault();
    				break;
    			case "a":
    				aDown = false;
    				event.preventDefault();
    				break;
    			case "s":
    				sDown = false;
    				event.preventDefault();
    				break;
    			case "d":
    				dDown = false;
    				event.preventDefault();
    				break;
    			case "j":
    				jDown = false;
    				event.preventDefault();
    				break;
    			case "l":
    				lDown = false;
    				event.preventDefault();
    				break;
    			case "i":
    				spaceDown = false;
    				if ($ballSlot1) {
    					ball1Coords.update($ball1Coords => ({ x: $coords.x, y: $coords.y }));
    					set_store_value(ballSlot1, $ballSlot1 = false, $ballSlot1);
    				} else if ($ballSlot2) {
    					ball2Coords.update($ball2Coords => ({ x: $coords.x, y: $coords.y }));
    					set_store_value(ballSlot2, $ballSlot2 = false, $ballSlot2);
    				} else if ($ballSlot3) {
    					ball3Coords.update($ball3Coords => ({ x: $coords.x, y: $coords.y }));
    					set_store_value(ballSlot3, $ballSlot3 = false, $ballSlot3);
    				} else if ($ballSlot4) {
    					ball4Coords.update($ball4Coords => ({ x: $coords.x, y: $coords.y }));
    					set_store_value(ballSlot4, $ballSlot4 = false, $ballSlot4);
    				}
    				event.preventDefault();
    				break;
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Robot> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onInterval,
    		test,
    		ballSlot1,
    		ballSlot2,
    		ballSlot3,
    		ballSlot4,
    		intake,
    		spring,
    		writable,
    		ShotCargo,
    		Cargo,
    		key,
    		x,
    		y,
    		speedModifier,
    		wDown,
    		aDown,
    		sDown,
    		dDown,
    		jDown,
    		lDown,
    		spaceDown,
    		yValue,
    		xValue,
    		coords,
    		ball1Coords,
    		ball2Coords,
    		ball3Coords,
    		ball4Coords,
    		floorBalls,
    		centerCoords,
    		maxYAcc,
    		maxXAcc,
    		maxRotAcc,
    		maxRotSpeed,
    		rotAcc,
    		rot,
    		rotDecay,
    		rotPace,
    		yDecay,
    		xDecay,
    		milliCount,
    		countUp,
    		calcRotation,
    		calcMovement,
    		checkMoveValid,
    		manageIntake,
    		rotate,
    		on_key_down,
    		on_key_up,
    		$ballSlot4,
    		$coords,
    		$ballSlot3,
    		$ballSlot2,
    		$ballSlot1,
    		$ball1Coords,
    		$centerCoords,
    		$ball2Coords,
    		$ball3Coords,
    		$ball4Coords
    	});

    	$$self.$inject_state = $$props => {
    		if ('key' in $$props) key = $$props.key;
    		if ('x' in $$props) x = $$props.x;
    		if ('y' in $$props) y = $$props.y;
    		if ('speedModifier' in $$props) speedModifier = $$props.speedModifier;
    		if ('wDown' in $$props) wDown = $$props.wDown;
    		if ('aDown' in $$props) aDown = $$props.aDown;
    		if ('sDown' in $$props) sDown = $$props.sDown;
    		if ('dDown' in $$props) dDown = $$props.dDown;
    		if ('jDown' in $$props) jDown = $$props.jDown;
    		if ('lDown' in $$props) lDown = $$props.lDown;
    		if ('spaceDown' in $$props) spaceDown = $$props.spaceDown;
    		if ('yValue' in $$props) yValue = $$props.yValue;
    		if ('xValue' in $$props) xValue = $$props.xValue;
    		if ('ball1Coords' in $$props) $$invalidate(12, ball1Coords = $$props.ball1Coords);
    		if ('ball2Coords' in $$props) $$invalidate(13, ball2Coords = $$props.ball2Coords);
    		if ('ball3Coords' in $$props) $$invalidate(14, ball3Coords = $$props.ball3Coords);
    		if ('ball4Coords' in $$props) $$invalidate(15, ball4Coords = $$props.ball4Coords);
    		if ('floorBalls' in $$props) $$invalidate(16, floorBalls = $$props.floorBalls);
    		if ('centerCoords' in $$props) $$invalidate(17, centerCoords = $$props.centerCoords);
    		if ('maxYAcc' in $$props) maxYAcc = $$props.maxYAcc;
    		if ('maxXAcc' in $$props) maxXAcc = $$props.maxXAcc;
    		if ('maxRotAcc' in $$props) maxRotAcc = $$props.maxRotAcc;
    		if ('maxRotSpeed' in $$props) maxRotSpeed = $$props.maxRotSpeed;
    		if ('rotAcc' in $$props) rotAcc = $$props.rotAcc;
    		if ('rot' in $$props) $$invalidate(0, rot = $$props.rot);
    		if ('rotDecay' in $$props) rotDecay = $$props.rotDecay;
    		if ('rotPace' in $$props) rotPace = $$props.rotPace;
    		if ('yDecay' in $$props) yDecay = $$props.yDecay;
    		if ('xDecay' in $$props) xDecay = $$props.xDecay;
    		if ('milliCount' in $$props) $$invalidate(20, milliCount = $$props.milliCount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*milliCount*/ 1048576) {
    			{
    				calcMovement();
    				calcRotation();
    				manageIntake();
    			}
    		}
    	};

    	return [
    		rot,
    		$ballSlot4,
    		$coords,
    		$ballSlot3,
    		$ballSlot2,
    		$ballSlot1,
    		$ball1Coords,
    		$centerCoords,
    		$ball2Coords,
    		$ball3Coords,
    		$ball4Coords,
    		coords,
    		ball1Coords,
    		ball2Coords,
    		ball3Coords,
    		ball4Coords,
    		floorBalls,
    		centerCoords,
    		on_key_down,
    		on_key_up,
    		milliCount
    	];
    }

    class Robot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Robot",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.48.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let div;
    	let svg;
    	let circle;
    	let t;
    	let robot;
    	let current;
    	robot = new Robot({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			t = space();
    			create_component(robot.$$.fragment);
    			attr_dev(circle, "fill", "none");
    			attr_dev(circle, "r", /*hubSize*/ ctx[0]);
    			attr_dev(circle, "stroke", "white");
    			attr_dev(circle, "stroke-linecap", "round");
    			attr_dev(circle, "stroke-width", "8");
    			attr_dev(circle, "stroke-linejoin", "round");
    			add_location(circle, file, 7, 71, 226);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "fixed overflow-visible");
    			add_location(svg, file, 7, 0, 155);
    			attr_dev(div, "class", "box grid h-screen w-screen place-items-center fixed");
    			add_location(div, file, 6, 0, 88);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, circle);
    			insert_dev(target, t, anchor);
    			mount_component(robot, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(robot.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(robot.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t);
    			destroy_component(robot, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let hubSize = 120;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Robot, hubSize });

    	$$self.$inject_state = $$props => {
    		if ('hubSize' in $$props) $$invalidate(0, hubSize = $$props.hubSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [hubSize];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var css_248z = "/*\n! tailwindcss v3.1.4 | MIT License | https://tailwindcss.com\n*//*\n1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)\n2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)\n*/\n\n*,\n::before,\n::after {\n  box-sizing: border-box; /* 1 */\n  border-width: 0; /* 2 */\n  border-style: solid; /* 2 */\n  border-color: #e5e7eb; /* 2 */\n}\n\n::before,\n::after {\n  --tw-content: '';\n}\n\n/*\n1. Use a consistent sensible line-height in all browsers.\n2. Prevent adjustments of font size after orientation changes in iOS.\n3. Use a more readable tab size.\n4. Use the user's configured `sans` font-family by default.\n*/\n\nhtml {\n  line-height: 1.5; /* 1 */\n  -webkit-text-size-adjust: 100%; /* 2 */\n  -moz-tab-size: 4; /* 3 */\n  -o-tab-size: 4;\n     tab-size: 4; /* 3 */\n  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"; /* 4 */\n}\n\n/*\n1. Remove the margin in all browsers.\n2. Inherit line-height from `html` so users can set them as a class directly on the `html` element.\n*/\n\nbody {\n  margin: 0; /* 1 */\n  line-height: inherit; /* 2 */\n}\n\n/*\n1. Add the correct height in Firefox.\n2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)\n3. Ensure horizontal rules are visible by default.\n*/\n\nhr {\n  height: 0; /* 1 */\n  color: inherit; /* 2 */\n  border-top-width: 1px; /* 3 */\n}\n\n/*\nAdd the correct text decoration in Chrome, Edge, and Safari.\n*/\n\nabbr:where([title]) {\n  -webkit-text-decoration: underline dotted;\n          text-decoration: underline dotted;\n}\n\n/*\nRemove the default font size and weight for headings.\n*/\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-size: inherit;\n  font-weight: inherit;\n}\n\n/*\nReset links to optimize for opt-in styling instead of opt-out.\n*/\n\na {\n  color: inherit;\n  text-decoration: inherit;\n}\n\n/*\nAdd the correct font weight in Edge and Safari.\n*/\n\nb,\nstrong {\n  font-weight: bolder;\n}\n\n/*\n1. Use the user's configured `mono` font family by default.\n2. Correct the odd `em` font sizing in all browsers.\n*/\n\ncode,\nkbd,\nsamp,\npre {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; /* 1 */\n  font-size: 1em; /* 2 */\n}\n\n/*\nAdd the correct font size in all browsers.\n*/\n\nsmall {\n  font-size: 80%;\n}\n\n/*\nPrevent `sub` and `sup` elements from affecting the line height in all browsers.\n*/\n\nsub,\nsup {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\n\nsub {\n  bottom: -0.25em;\n}\n\nsup {\n  top: -0.5em;\n}\n\n/*\n1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)\n2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)\n3. Remove gaps between table borders by default.\n*/\n\ntable {\n  text-indent: 0; /* 1 */\n  border-color: inherit; /* 2 */\n  border-collapse: collapse; /* 3 */\n}\n\n/*\n1. Change the font styles in all browsers.\n2. Remove the margin in Firefox and Safari.\n3. Remove default padding in all browsers.\n*/\n\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  font-family: inherit; /* 1 */\n  font-size: 100%; /* 1 */\n  font-weight: inherit; /* 1 */\n  line-height: inherit; /* 1 */\n  color: inherit; /* 1 */\n  margin: 0; /* 2 */\n  padding: 0; /* 3 */\n}\n\n/*\nRemove the inheritance of text transform in Edge and Firefox.\n*/\n\nbutton,\nselect {\n  text-transform: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Remove default button styles.\n*/\n\nbutton,\n[type='button'],\n[type='reset'],\n[type='submit'] {\n  -webkit-appearance: button; /* 1 */\n  background-color: transparent; /* 2 */\n  background-image: none; /* 2 */\n}\n\n/*\nUse the modern Firefox focus style for all focusable elements.\n*/\n\n:-moz-focusring {\n  outline: auto;\n}\n\n/*\nRemove the additional `:invalid` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)\n*/\n\n:-moz-ui-invalid {\n  box-shadow: none;\n}\n\n/*\nAdd the correct vertical alignment in Chrome and Firefox.\n*/\n\nprogress {\n  vertical-align: baseline;\n}\n\n/*\nCorrect the cursor style of increment and decrement buttons in Safari.\n*/\n\n::-webkit-inner-spin-button,\n::-webkit-outer-spin-button {\n  height: auto;\n}\n\n/*\n1. Correct the odd appearance in Chrome and Safari.\n2. Correct the outline style in Safari.\n*/\n\n[type='search'] {\n  -webkit-appearance: textfield; /* 1 */\n  outline-offset: -2px; /* 2 */\n}\n\n/*\nRemove the inner padding in Chrome and Safari on macOS.\n*/\n\n::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Change font properties to `inherit` in Safari.\n*/\n\n::-webkit-file-upload-button {\n  -webkit-appearance: button; /* 1 */\n  font: inherit; /* 2 */\n}\n\n/*\nAdd the correct display in Chrome and Safari.\n*/\n\nsummary {\n  display: list-item;\n}\n\n/*\nRemoves the default spacing and border for appropriate elements.\n*/\n\nblockquote,\ndl,\ndd,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6,\nhr,\nfigure,\np,\npre {\n  margin: 0;\n}\n\nfieldset {\n  margin: 0;\n  padding: 0;\n}\n\nlegend {\n  padding: 0;\n}\n\nol,\nul,\nmenu {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n}\n\n/*\nPrevent resizing textareas horizontally by default.\n*/\n\ntextarea {\n  resize: vertical;\n}\n\n/*\n1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)\n2. Set the default placeholder color to the user's configured gray 400 color.\n*/\n\ninput::-moz-placeholder, textarea::-moz-placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\ninput::placeholder,\ntextarea::placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\n/*\nSet the default cursor for buttons.\n*/\n\nbutton,\n[role=\"button\"] {\n  cursor: pointer;\n}\n\n/*\nMake sure disabled buttons don't get the pointer cursor.\n*/\n:disabled {\n  cursor: default;\n}\n\n/*\n1. Make replaced elements `display: block` by default. (https://github.com/mozdevs/cssremedy/issues/14)\n2. Add `vertical-align: middle` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)\n   This can trigger a poorly considered lint error in some tools but is included by design.\n*/\n\nimg,\nsvg,\nvideo,\ncanvas,\naudio,\niframe,\nembed,\nobject {\n  display: block; /* 1 */\n  vertical-align: middle; /* 2 */\n}\n\n/*\nConstrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)\n*/\n\nimg,\nvideo {\n  max-width: 100%;\n  height: auto;\n}\n\n:root,\n[data-theme] {\n  background-color: hsla(var(--b1) / var(--tw-bg-opacity, 1));\n  color: hsla(var(--bc) / var(--tw-text-opacity, 1));\n}\n\nhtml {\n  -webkit-tap-highlight-color: transparent;\n}\n\n:root {\n  --p: 0 0% 100%;\n  --pf: 0 0% 80%;\n  --sf: 218 54% 14%;\n  --af: 319 22% 21%;\n  --nf: 270 4% 7%;\n  --pc: 0 0% 20%;\n  --sc: 218 100% 84%;\n  --ac: 319 85% 85%;\n  --inc: 202 100% 14%;\n  --suc: 89 100% 10%;\n  --wac: 54 100% 13%;\n  --erc: 0 100% 14%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 218 54% 18%;\n  --a: 319 22% 26%;\n  --n: 270 4% 9%;\n  --nc: 37 67% 58%;\n  --b1: 240 10% 4%;\n  --b2: 270 4% 9%;\n  --b3: 270 2% 18%;\n  --bc: 37 67% 58%;\n  --in: 202 100% 70%;\n  --su: 89 62% 52%;\n  --wa: 54 69% 64%;\n  --er: 0 100% 72%;\n}\n\n*, ::before, ::after {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\n\n::-webkit-backdrop {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\n\n::backdrop {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\r\n@-webkit-keyframes spin {\n\n  from {\n    transform: rotate(0deg);\n  }\n\n  to {\n    transform: rotate(360deg);\n  }\n}\r\n@keyframes spin {\n\n  from {\n    transform: rotate(0deg);\n  }\n\n  to {\n    transform: rotate(360deg);\n  }\n}\r\n@-webkit-keyframes button-pop {\n\n  0% {\n    transform: scale(var(--btn-focus-scale, 0.95));\n  }\n\n  40% {\n    transform: scale(1.02);\n  }\n\n  100% {\n    transform: scale(1);\n  }\n}\r\n@keyframes button-pop {\n\n  0% {\n    transform: scale(var(--btn-focus-scale, 0.95));\n  }\n\n  40% {\n    transform: scale(1.02);\n  }\n\n  100% {\n    transform: scale(1);\n  }\n}\r\n@-webkit-keyframes checkmark {\n\n  0% {\n    background-position-y: 5px;\n  }\n\n  50% {\n    background-position-y: -2px;\n  }\n\n  100% {\n    background-position-y: 0;\n  }\n}\r\n@keyframes checkmark {\n\n  0% {\n    background-position-y: 5px;\n  }\n\n  50% {\n    background-position-y: -2px;\n  }\n\n  100% {\n    background-position-y: 0;\n  }\n}\r\n@-webkit-keyframes progress-loading {\n\n  50% {\n    left: 107%;\n  }\n}\r\n@keyframes progress-loading {\n\n  50% {\n    left: 107%;\n  }\n}\r\n@-webkit-keyframes radiomark {\n\n  0% {\n    box-shadow: 0 0 0 12px hsl(var(--b1)) inset, 0 0 0 12px hsl(var(--b1)) inset;\n  }\n\n  50% {\n    box-shadow: 0 0 0 3px hsl(var(--b1)) inset, 0 0 0 3px hsl(var(--b1)) inset;\n  }\n\n  100% {\n    box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n  }\n}\r\n@keyframes radiomark {\n\n  0% {\n    box-shadow: 0 0 0 12px hsl(var(--b1)) inset, 0 0 0 12px hsl(var(--b1)) inset;\n  }\n\n  50% {\n    box-shadow: 0 0 0 3px hsl(var(--b1)) inset, 0 0 0 3px hsl(var(--b1)) inset;\n  }\n\n  100% {\n    box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n  }\n}\r\n@-webkit-keyframes rating-pop {\n\n  0% {\n    transform: translateY(-0.125em);\n  }\n\n  40% {\n    transform: translateY(-0.125em);\n  }\n\n  100% {\n    transform: translateY(0);\n  }\n}\r\n@keyframes rating-pop {\n\n  0% {\n    transform: translateY(-0.125em);\n  }\n\n  40% {\n    transform: translateY(-0.125em);\n  }\n\n  100% {\n    transform: translateY(0);\n  }\n}\r\n.fixed {\n  position: fixed;\n}\r\n.z-40 {\n  z-index: 40;\n}\r\n.-mt-\\[30px\\] {\n  margin-top: -30px;\n}\r\n.-mt-\\[80px\\] {\n  margin-top: -80px;\n}\r\n.-mt-\\[100px\\] {\n  margin-top: -100px;\n}\r\n.-mt-\\[150px\\] {\n  margin-top: -150px;\n}\r\n.-mt-\\[180px\\] {\n  margin-top: -180px;\n}\r\n.-mt-\\[188px\\] {\n  margin-top: -188px;\n}\r\n.-mt-\\[138px\\] {\n  margin-top: -138px;\n}\r\n.-ml-\\[150px\\] {\n  margin-left: -150px;\n}\r\n.-ml-\\[75px\\] {\n  margin-left: -75px;\n}\r\n.-ml-\\[80px\\] {\n  margin-left: -80px;\n}\r\n.-mt-\\[168px\\] {\n  margin-top: -168px;\n}\r\n.-mt-\\[158px\\] {\n  margin-top: -158px;\n}\r\n.grid {\n  display: grid;\n}\r\n.h-screen {\n  height: 100vh;\n}\r\n.h-\\[70px\\] {\n  height: 70px;\n}\r\n.h-\\[90px\\] {\n  height: 90px;\n}\r\n.h-6 {\n  height: 1.5rem;\n}\r\n.w-screen {\n  width: 100vw;\n}\r\n.w-6 {\n  width: 1.5rem;\n}\r\n.w-\\[130px\\] {\n  width: 130px;\n}\r\n.w-72 {\n  width: 18rem;\n}\r\n.w-\\[30px\\] {\n  width: 30px;\n}\r\n.w-\\[70px\\] {\n  width: 70px;\n}\r\n.w-\\[150px\\] {\n  width: 150px;\n}\r\n.w-\\[160px\\] {\n  width: 160px;\n}\r\n.transform {\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.place-items-center {\n  place-items: center;\n}\r\n.overflow-visible {\n  overflow: visible;\n}\r\n/*My hatred for CSS is present in the emptiness of this file*/\r\n\r\n";
    styleInject(css_248z);

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
