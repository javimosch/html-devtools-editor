<template>
  <div class="Root">
    <section name="toolbar">
      <div class="container">
        
        <h1 class="is-size-3 has-text-centered">html devtools editor</h1>

<div class="container is-fluid">
        <p class="is-size-7">
          You can create components, include one inside each other, style them using css classes or inline css, and generate html.
          </p>
          <p class="is-size-7">
            Inspired by the devtools console workflow.
            </p>
          </div>

      <div class="columns">
        <div class="column is-half">
          <nav class="panel">
          <p class="panel-heading has-text-black-ter is-size-7">

<input placeholder="Component name" class="is-size-4 ComponentName" v-model="component.name"/>

          </p>
          <div class="panel-block">
            <div class="buttons are-small">
              <button class="button is-dark" @click="saveComponent">Save changes</button>
            <button class="button is-light" @click="format">Format code</button>
            <button class="button is-light" @click="newComponent">New component</button>
            <button class="button is-light" v-show="component._id" @click="removeComponent">Remove</button>
            <button class="button is-light"  @click="()=>isExportModalActive=true">Export HTML</button>
            
            <button class="button is-light"  @click="()=>importStyles.enabled=true"
              v-show="component._id"
              >Import Styles</button>

            </div>
            
            
          </div>
        </nav>
        </div>
        <div class="column is-half">
<nav class="panel ComponentsPanel">
          <p class="panel-heading has-text-black-ter is-size-7">
            Components
            </p>

<div class="panel-block button is-black is-size-7" v-for="cmp in components" :key="cmp._id" @click="loadComponent(cmp)">
  {{cmp.name}}
  </div>

            </nav>

        </div>
      </div>

        
      </div>
    </section>
    <section name="content" class="is-paddingles">
      <div class="container is-fullhd">
        
      <div class="columns is-multiline is-mobile">
        <div class="column is-two-fifth ">
          <iframe class="renderWrapper" ref="iframe"/>
        </div>
        <div class="column is-two-fifth ">
          <codemirror ref="myCm" v-model="component.code" :options="cmOptions" @input="onCmCodeChange"
          style="position:relative;"
          ></codemirror>
        </div>

        
        <div class="column is-one-fifth ">
          <nav class="panel">
            <p class="panel-heading">Styles</p>
            


            <div class="panel-block" >
              
              <ul>

<li class="is-size-5">Selected</li>
 <li v-for="className in selection.classes" :key="className">
                  {{className}}
                  <ul>

                    
                    <li v-for="(style, index) in getStylesForClass(className)" :key="index">
                      <input v-model="style.rule" @keyup="handleStyleKeyup" class="styleItem_rule">
                      
                      <input
                        v-model="style.value"
                        @keyup="handleStyleKeyup"
                        @blur.capture="handleRuleBlur(style, index, className)"
                        class="styleItem_value"
                      >
                    </li>
                    <li>
                      <div class style="margin-top:10px;">
                        <button
                          class="button is-black is-small"
                          @click="newStyleItem(className)"
                        >New rule</button>
                      </div>
                    </li>
                  </ul>
                </li>
<li class="is-size-5">All</li>
<li v-for="className in componentsClasses" :key="className">
                  {{className}}
                  <ul>
                    <li v-for="(style, index) in component.styles[className]" :key="index">
                      <input v-model="style.rule" @keyup="handleStyleKeyup" class="styleItem_rule">
                      
                      <input
                        v-model="style.value"
                        @keyup="handleStyleKeyup"
                        @blur.capture="handleRuleBlur(style, index, className)"
                        class="styleItem_value"
                      >
                    </li>
                    <li>
                      <div class style="margin-top:10px;">
                        <button
                          class="button is-black is-small"
                          @click="newStyleItem(className)"
                        >New rule</button>
                      </div>
                    </li>
                  </ul>
                </li>


               
              </ul>
            </div>
            <div class="panel-block"></div>
          </nav>
        </div>
      </div>

      </div>
    </section>
    <section name="debug" v-if="false">
      <div class="container">
        <textarea v-html="JSON.stringify({
          metadata:{
            //...metadata,
            selection:selection
          },
          component:{
            _id:component._id,
            name:component.name
          },
          components:components
        },null,4)"></textarea>
        
      </div>
    </section>
    <section name="footer">
      <footer class="has-text-centered">
        <a href="https://misitoba.com" target="_blank">
        By MisitioBA
        </a>
      </footer>
    </section>

<div :class="exportModalClassName">
  <div class="modal-background"></div>
  <div class="modal-content">
    <textarea v-html="metadata.generatedHTML"></textarea>
  </div>
  <button @click="closeExportModal" class="modal-close is-large" aria-label="close"></button>
</div>

<div :class="importStylesModalClassName">
  <div class="modal-background"></div>
  <div class="modal-content">
    <textarea v-model="importStyles.json"></textarea>
    
   
    
     <button class="button is-dark" @click="handleImportStyles">Import</button>

      <div class="container is-fluid">
      <h5>How to steal styles from a third party website</h5>
    <p>Select the dom element you want to steal from using the Elements tab in devtools.</p>
    <p>Run the follow code in devtools console:</p>
    <textarea v-html="importStylesInjectCode"></textarea>
    <p>Copy the generated string above (Remember to remove double-quotes, i.e: {"blockSize":"33px"})</p>
    </div>
  </div>
  <button @click="()=>importStyles.enabled=false" class="modal-close is-large" aria-label="close"></button>
</div>

  </div>
</template>
<script>
import "codemirror/mode/javascript/javascript.js";
import "codemirror/mode/htmlmixed/htmlmixed.js";
import "codemirror/theme/base16-dark.css";
const pretty = require("pretty");
const cheerio = require("cheerio");
const uniqid = require('uniqid');

export default {
  name: "Editor",
  data() {
    return {
      importStyles:{
        enabled:false,
        json:''
      },
      isExportModalActive:false,
      metadata:{
        generatedHTML:''
      },
      components:[],
      component:{
        _id:'',
        name:'',
        code:'',
        styles:{}
      },
      defaultCode:`<div class="MyComponent">

<!-- To edit the rules of any class, just select the entire tag using the editor -->

  MyComponent
  <!-- You can include other components adding: -->
  <!-- CMP:MyFooter -->
  <!-- Create a new component and name it MyFooter -->
</div>`
     ,
      cmOptions: {
        lineWrapping:true,
        tabSize: 1,
        mode: "text/html",
        theme: "base16-dark",
        lineNumbers: true,
        line: true
        // more codemirror options, 更多 codemirror 的高级配置...
      },
      selection: {
        name: "",
        classes: []
      }
    };
  },
  methods: {
    handleImportStyles(){
      const camelToSnakeCase = str => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      try{
        let styles = JSON.parse(this.importStyles.json)
        Object.keys(styles).forEach(key=>{
          
          this.component.styles['imported'] = this.component.styles['imported'] || []
          let rule = camelToSnakeCase(key)
          console.log(rule)
          let match = this.component.styles['imported'].find(item=>item.rule===rule)
          if(!match){
            match = {
              rule,
              value: styles[key]
            }
            this.component.styles['imported'].push(match)
          }else{
            match.value = styles[key]
          }
        })
        this.importStyles.enabled=false
        this.$forceUpdate()
        this.render()
      }catch(err){
        console.log(err.stack)
      }
    },
    closeExportModal(){
      this.isExportModalActive = false
    },
    removeComponent(){
      if(window.confirm('Sure?')){
        for(var x in this.components){
          if(this.components[x]._id===this.component._id){
            this.components.splice(x,1)
            this.newComponent(false)    
            this.saveComponentsLocally()
            return
          }
        }
        
      }
    },
    newComponent(save = true){
      if(save){
        this.saveComponent()
      }
      Object.assign(this.component,{
        name:'',
        _id:'',
        code: this.defaultCode,
        styles:{}
      })
    },
    loadComponent(cmp){
      if(this.component._id!==cmp._id){
        this.saveComponent()
        Object.assign(this.component, cmp)
      }
    },
    saveComponent(){
      if(!this.component.name){
        //alert('Name required')
        console.log('NAME_REQUIRED')
        return;
      }
      if(!this.component._id){
        this.component._id = uniqid(`uniqid-`)
      }
      let match = this.components.find(cmp=>cmp._id===this.component._id)
      if(!match){
        
        match = {
          _id:this.component._id,
          name:this.component.name,
          code:this.component.code,
          styles:Object.assign({},this.component.styles)
        }
        this.components.push(match)
      }else{
        match.name = this.component.name
        Object.assign(match,{
          name:this.component.name,
          code:this.component.code,
          styles:Object.assign({},this.component.styles)
        })
      }

     this.saveComponentsLocally()
    },
    saveComponentsLocally(){
 window.localStorage.setItem('components',JSON.stringify([].concat(this.components.map(cmp=>({
        ...cmp
      })))))
    },
    editorUpdate(instance, event) {
      let selection = this.codemirror.getSelections()[0] || ""
      let line = selection
      if(!line) return

    this.metadata.line = line

    if(line.indexOf('class="')!==-1){
      let classes = line.substr(line.indexOf('class="')+7)
      classes = classes.split('"')[0]
      classes = classes.split(' ')
      this.selection.classes = classes
    }

    this.$forceUpdate()
    
    },
    newStyleItem(className) {
      let newItem = this.component.styles[className].find(style => !style.rule);
      if (newItem) return;
      this.component.styles[className].push({
        rule: "",
        value: ""
      });
      this.$forceUpdate();
      this.render();
    },
    handleRuleBlur(styleItem, index, className) {
      if (styleItem.value === "") {
        this.component.styles[className].splice(index, 1);
      }
      this.$forceUpdate();
    },
    getStylesForClass(name) {
      this.component.styles[name] = this.component.styles[name] || [];
      return this.component.styles[name];
    },
    format() {
      this.component.code = pretty(this.component.code);
    },
    onCmCodeChange(newCode) {
      this.render();
    },
    handleStyleKeyup() {
      this.render();
    },
    compileStyles(stylesObject){
      function filterValidRules(style) {
        return !!style.rule && !!style.value;
      }
      function filterValidItems(className){
        return stylesObject[className].filter(filterValidRules).length > 0
      }
      let styleKeys = Object.keys(stylesObject || {});
        return `${styleKeys.filter(filterValidItems).map(styleKey => {
          return `.${styleKey}{
            ${stylesObject[styleKey]
              .filter(filterValidRules)
              .map(style => {
                return `${style.rule}: ${style.value}`;
              })
              .join(";")}
          }`;
        }).join(`
        `)}`
    },
    compileComponent(name){
      let cmp = null
      if(typeof name === 'object'){
        cmp = this.component
      }else{
        cmp = this.components.find(cmp=>cmp.name===name)
      }

      if(!cmp){
        return ''
      }
      
      const $ = cheerio.load(cmp.code);
      let stylesAsString = `<style scoped>
      ${this.compileStyles(cmp.styles)}
      </style>`
      let html = $.root().find('body').children().first().html()
      $.root().find('body').children().first().html(html+stylesAsString)
      
      let originalClasses = []
      
      $.root().find('[class]').toArray().forEach(el=>{
        let cls = $(el).attr('class').split(' ')
        originalClasses = originalClasses.concat(cls)
        $(el).attr('class', cls.map(clsName=>{
          return cmp.name+`_`+clsName
        }).join(' '))
      })

      html = $.root().find('body').html()

      originalClasses.forEach(clsName=>{
        html = html.split(`.${clsName}`).join(`.${cmp.name+`_`+clsName}`)
      })
      
      html = this.compileChildComponents(html, cmp.name)

      return html
    },
    compileChildComponents(html, fromName = ''){
     
     html = html.split('<!--').map(html=>{
       if(html.indexOf('CMP:')!==-1){
         let cmpName = html.split('-->')[0].split('CMP:').join('').trim()

        if(cmpName === fromName){
          return html
        }

        let cmpHtml = this.compileComponent(cmpName)
        return html.split('-->').join(`-->${cmpHtml}`)
        //return html.split(`CMP:${cmpName}`).join(this.compileComponent(cmpName))

       }else{
         return html
       }
     }).join('<!--')
     //console.log('COMPILED',html)
      return html
    },
    render() {
      let raw = this.compileComponent(this.component)

      raw = raw.split(/<!--[\s\S]*?-->/g).join('')

      const $ = cheerio.load(raw);
      
      /*
      //WIP: retrieve computed styles from iframe
      let script = document.createElement('script')
      script.innerHTML = `
      var injectStylesGetter = ${injectStylesGetter.toString()}
      injectStylesGetter()`

      $.root().find('body').html($.root().find('body').html() + script.outerHTML)
      */

      raw = $.html()
      this.metadata.generatedHTML = raw
      
      var ifrm = this.$refs.iframe;
      ifrm =
        ifrm.contentWindow ||
        ifrm.contentDocument.document ||
        ifrm.contentDocument;
      ifrm.document.open();
      ifrm.document.write(raw);
      ifrm.document.close();
    },
    loadComponentsFromCache(){
      let cmps = localStorage.getItem('components')
      try{
        cmps = JSON.parse(cmps)
        cmps.forEach(cmp=>this.components.push(cmp))
      }catch(err){}
    }
  },
  computed: {
    importStylesInjectCode(){
      return `
      if(typeof injectStylesGetter === 'undefined'){
        var injectStylesGetter = ${injectStylesGetter.toString()}
        injectStylesGetter()
      }
      JSON.stringify(getStylesWithoutDefaults($0))
      `
    },
    importStylesModalClassName(){
      return `modal ${this.importStyles.enabled?'is-active':''}`
    },
    componentsClasses(){
      return Object.keys(this.component.styles)
    },
    exportModalClassName(){
      return `modal ${this.isExportModalActive?'is-active':''}`
    },
    codemirror() {
      return this.$refs.myCm.codemirror;
    }
  },
  mounted() {
    let cm = (window.cm = this.codemirror);
    cm.on("cursorActivity", this.editorUpdate);
    this.render();
    this.loadComponentsFromCache()
  }
};


function injectStylesGetter(){

window.getComputedStyle = window.getComputedStyle || function( element ) {
  return element.currentStyle;
}
window.getStylesWithoutDefaults = getStylesWithoutDefaults
function getStylesWithoutDefaults( element ) {

  // creating an empty dummy object to compare with
  var dummy = document.createElement( 'element-' + ( new Date().getTime() ) );
  document.body.appendChild( dummy );

  // getting computed styles for both elements
  var defaultStyles = getComputedStyle( dummy );
  var elementStyles = getComputedStyle( element );

  // calculating the difference
  var diff = {};
  for( var key in elementStyles ) {
    if(elementStyles.hasOwnProperty(key)
          && defaultStyles[ key ] !== elementStyles[ key ] )
    {
      diff[ key ] = elementStyles[ key ];
    }
  }

  // clear dom
  dummy.remove();

  return diff;
}
}
</script>
<style scoped>
.Root {
  text-align: left;
}
.renderWrapper {
  width: 100%;
  min-height:400px;
}
textarea {
  min-height: 300px;
  width: 100%;
}
.styleItem_value {
  font-size: 10px;
  display: inline-block;
  width: 50%;
}
.styleItem_rule {
  font-size: 10px;
  display: inline-block;
  width: 50%;
}
.ComponentName{
  border:0px;
}
.ComponentName,.ComponentName:focus,.ComponentName:active{
  outline:0px;
}
.ComponentsPanel{
  max-height:200px;
  overflow:auto;
}
</style>


