# keep-alive-fix
vue keep-alive里的router-view的key会影响热更新 导致页面白屏

# 修复方法

将keepAliveFix.js导入项目，并在main.js中导入即可


# 问题点原因：
keep-alive默认取里面的router-view（第一个组件）上设置的key作为缓存的key

导致该组件热更后老的组件选项已经不存在了，但是keep-alive仍然在读取老组件，从而导致页面白屏无法渲染

# keepAliveFix.js 修复原理

重写keep-alive组件，让缓存的key 为 router-view设置的key + 组件选项Cid
具体代码在124行
          : vnode.key + componentOptions.Ctor.cid

组件选项Cid每次热更都会变动，让其缓存的key失效。
