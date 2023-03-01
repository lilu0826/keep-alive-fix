import Vue from "vue"
/*
* VUE2版本
* 修复keep-alive包裹的组件在开发热更新时无法正常热更问题，开发模式下有效
* 生产环境该文件无效
* 在main.js中导入该文件
* https://github.com/vuejs/vue-loader/issues/1332#issuecomment-601572625
*/

function isDef(v) {
    return v !== undefined && v !== null
}
function isAsyncPlaceholder(node) {
    return node.isComment && node.asyncFactory
}
function getFirstComponentChild(children) {
    if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
        var c = children[i]
        if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
        return c
        }
    }
    }
}
function getComponentName(opts) {
    return opts && (opts.Ctor.options.name || opts.tag)
}
function matches(pattern, name) {
    if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
    } else if (typeof pattern === "string") {
    return pattern.split(",").indexOf(name) > -1
    } else if (isRegExp(pattern)) {
    return pattern.test(name)
    }
    /* istanbul ignore next */
    return false
}
function remove(arr, item) {
    if (arr.length) {
    var index = arr.indexOf(item)
    if (index > -1) {
        return arr.splice(index, 1)
    }
    }
}
function pruneCacheEntry(cache, key, keys, current) {
    var cached$$1 = cache[key]
    if (cached$$1 && (!current || cached$$1.tag !== current.tag)) {
    cached$$1.componentInstance.$destroy()
    }
    cache[key] = null
    remove(keys, key)
}
function pruneCache(keepAliveInstance, filter) {
    var cache = keepAliveInstance.cache
    var keys = keepAliveInstance.keys
    var _vnode = keepAliveInstance._vnode
    const cachedNameKeyMap = keepAliveInstance.cachedNameKeyMap
    for (var key in cache) {
    var cachedNode = cache[key]
    if (cachedNode) {
        var name = getComponentName(cachedNode.componentOptions)
        if (name && !filter(name)) {
        delete cachedNameKeyMap[name]
        pruneCacheEntry(cache, key, keys, _vnode)
        }
    }
    }
}
const patternTypes = [String, RegExp, Array]
const KeepAlive = {
  name: "keep-alive",
  abstract: true,

  props: {
    include: patternTypes,
    exclude: patternTypes,
    max: [String, Number],
  },

  created() {
    this.cache = Object.create(null)
    this.cachedNameKeyMap = Object.create(null)
    this.keys = []
  },
  destroyed() {
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },
  mounted() {
    this.$watch("include", val => {
      pruneCache(this, name => matches(val, name))
    })
    this.$watch("exclude", val => {
      pruneCache(this, name => !matches(val, name))
    })
  },
  render() {
    const slot = this.$slots.default
    const vnode = getFirstComponentChild(slot)
    const componentOptions = vnode && vnode.componentOptions
    if (componentOptions) {
      // check pattern
      const name = getComponentName(componentOptions)
      const { include, exclude } = this
      if (
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }
      const { cache, cachedNameKeyMap, keys } = this
      const key =
        vnode.key == null
          ? // same constructor may get registered as different local components
            // so cid alone is not enough (#3269)
            componentOptions.Ctor.cid +
            (componentOptions.tag ? `::${componentOptions.tag}` : "")
          : vnode.key + componentOptions.Ctor.cid
      if (cache[key]) {
        vnode.componentInstance = cache[key].componentInstance
        // make current key freshest
        remove(keys, key)
        keys.push(key)
      } else {
        cache[key] = vnode
        keys.push(key)
        // prune old component for hmr
        if (name && cachedNameKeyMap[name] && cachedNameKeyMap[name] !== key) {
          pruneCacheEntry(cache, cachedNameKeyMap[name], keys)
        }
        cachedNameKeyMap[name] = key
        // prune oldest entry
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode)
        }
      }
      vnode.data.keepAlive = true
    }
    return vnode || (slot && slot[0])
  },
}
// ovveride original keep-alive
process.env.NODE_ENV === "development" && Vue.component("KeepAlive", KeepAlive)