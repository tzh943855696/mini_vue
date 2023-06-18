class Vue {
    constructor(options) {
        this.$data = options.data
        Observe(this.$data)


        //属性劫持，把属性都挂载到vm上
        Object.keys(this.$data).forEach(item => {
            Object.defineProperty(this,item,{
                enumerable: true,
                configurable: true,
                get() {
                    this.$data[item]
                },
                set(newVal) {
                    this.$data[item] = newVal
                }
            })
        })

        //模板编译
        Compile(options.el,this)
    }
}

class Watcher {
    //cb = callback, vm - vue实例, key属性名
    constructor(vm,key,cb) {
        this.vm = vm
        this.key = key
        this.cb = cb
        Dep.target = this
        key.split('.').reduce((newObj,k) => newObj[k],vm)
        Dep.target = null
    }

    update() {
        let value = this.keys.split('.').reduce((newObj,k) => newObj[k],this.vm)
        this.cb()
    }
}

class Dep {
    constructor() {
        this.subs = []
    }
    //订阅
    addSub(watcher) {
        this.subs.push(watcher)
    }
    //发布
    notify() {
        this.subs.forEach( watcher => watcher.update())
    }
}

function Observe(obj) {
    //判断是不是对象，不是终止递归
    if(!obj ||  typeof obj !== 'object') return
    const dep = new Dep()
    Object.keys(obj).forEach(key => {
        let value = obj[key]
        Observe(obj[key])
        Object.defineProperty(obj,key,{
            enumerable:true,
            configurable:true,
            get() {
                Dep.target && dep.addSub(Dep.target)
                return value

            },
            set(newValue) {
                value = newValue
                Observe(value)
                dep.notify()
            }
        })
    })
}
//对HTML结构进行模板编译
function Compile(el,vm) {
    vm.$el = document.querySelector(el)

    //创建文档碎片，提高dom性能 
    fragment = document.createDocumentFragment()
    while(childNode = vm.$el.firstChild) {
        fragment.appendChild(childNode)
    }
    //进行模版编译
    replace(vm.$el)
    function replace(node){
        //插值表达式正则
        const regMustache = /\{\{\s*(\S+)\s*\}\}/

        if(node.nodeType === 3) {
            let text = node.textContent
            const execResult = regMustache.exec(text)
            if(execResult) {
                let value = execResult[1].split('.').reduce((newObj,k) => newObj[k],vm)
                node.textContent = text.replace(regMustache, value)

                //添加watcher,不能用value因为value是模版编译时候的值
                new Watcher(vm,execResult[1],(newVal) => {
                    node.textContent = text.replace(regMustache, newVal)
                })
            }
            return
        }

        node.childNodes.forEach(child => replace(child))
    }

    vm.$el.appendChild(fragment)
}