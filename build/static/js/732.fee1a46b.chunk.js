"use strict";(self.webpackChunkportfolio=self.webpackChunkportfolio||[]).push([[732],{8732:function(e,n,t){t.r(n),t.d(n,{default:function(){return g}});var o=t(4165),r=t(5861),a=t(9439),i=t(2791),s="_Home_centered-content__TctZo",l="_Home_home-section__swft8",c="_Home_matrix__H45AN",u="_Home_down-arrow__mbEIL",h=function(){var e=document.getElementById("hackerText"),n=document.querySelector(".".concat(s)),t=e.innerHTML,o="!#$%&'()*+,-./:;<=>?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",r=0,a=[],i=!1,l=!1,c=2*t.length,u=window.innerWidth<=768,h=[],f=sessionStorage.getItem("hasRun");function d(){var e=Math.floor(92*Math.random());return o[e]}return console.log(f),f&&(l=!0,n.style.color="#2ba2a2"),new Promise((function(o){for(var s=0;s<t.length;s++){h.push([])}for(var m=0;m<t.length;m++){for(var v=h[m],g=0;g<c-20*Math.random();g++)v.push(d());" "===t[m]&&u?a.push(" "):a.push(d),v.push(t[m])}for(var w=0;w<t.length;w++)a.push(d);function p(){if(i&&l){for(var n="",o=0;o<t.length;o++)Math.random()<.5?n+=String.fromCharCode(94*Math.random()+33):n+=t[o];n=n.substring(0,t.length),e.innerHTML=n}}e.addEventListener("mouseover",(function(){l&&(i=!0,clearInterval(x),n.style.color="#a22b2b",x=setInterval(p,100))})),e.addEventListener("mouseout",(function(){l&&(i=!1,e.innerHTML=t,n.style.color="#2ba2a2")}));var x=f?o():setInterval((function(){if(r<c){for(var i=0;i<t.length;i++){var s=h[i];r<s.length?" "===t[i]&&u?a[i]=" ":a[i]=s[r]:a[i]=s[s.length-1]}var f=a.join("");e.innerHTML=f.substring(0,t.length),console.log("'"+e.innerHTML+"'")}else l=!0,n.style.color="#2ba2a2",sessionStorage.setItem("hasRun","true"),clearInterval(x),o();r++}),100)}))},f=(t(2062),t(1830)),d=t.n(f),m=t(184),v=function(e){var n=e.startAnimation,t=(0,i.useRef)(null);return(0,i.useEffect)((function(){if(n){var e="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split(""),o=14,r=t.current,a=r.getContext("2d");r.width=window.innerWidth+10,r.height=window.innerHeight;for(var i=Math.floor(r.width/o)+10,s=(Math.floor(r.height/o),[]),l=0;l<i;l++)s[l]=1;!function n(){!function(){a.fillStyle="rgba(0, 0, 0, 0.05)",a.fillRect(0,0,r.width,r.height),a.fillStyle="#626e5e",a.font=o+"px monospace";for(var n=0;n<s.length;n++){var t=e[Math.floor(Math.random()*e.length)];a.fillText(t,n*o,s[n]*o),s[n]*o>r.height&&Math.random()>.975&&(s[n]=0),s[n]++}}(),requestAnimationFrame(n)}()}}),[n]),(0,m.jsx)("canvas",{className:c,id:"matrix",ref:t})},g=function(){var e=(0,i.useState)(!1),n=(0,a.Z)(e,2),t=n[0],c=n[1],f=(0,i.useState)(!0),g=(0,a.Z)(f,2),w=g[0],p=g[1];(0,i.useRef)(null);(0,i.useEffect)((function(){function e(){return(e=(0,r.Z)((0,o.Z)().mark((function e(){return(0,o.Z)().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,h();case 2:c(!0);case 3:case"end":return e.stop()}}),e)})))).apply(this,arguments)}!function(){e.apply(this,arguments)}();var n=function(){p(window.scrollY<=100)};return window.addEventListener("scroll",n),function(){window.removeEventListener("scroll",n)}}),[]);return(0,m.jsxs)("div",{className:l,id:"home",children:[(0,m.jsx)(v,{startAnimation:t}),(0,m.jsxs)("div",{className:s,children:[(0,m.jsx)("h1",{id:"hackerText",onClick:function(){console.log("H1 element clicked!");var e=sessionStorage.getItem("hasRun");e&&"true"===e&&d().fire({title:"Do you want to see the animation again?",icon:"question",showCancelButton:!0,confirmButtonText:"Yes",cancelButtonText:"No",confirmButtonColor:"#2ba2a2",cancelButtonColor:"#a22b2b"}).then((function(e){e.isConfirmed&&(sessionStorage.removeItem("hasRun"),window.location.reload())}))},children:"S h i v c h a r a n"}),t&&w&&(0,m.jsx)("div",{className:u})]})]})}}}]);
//# sourceMappingURL=732.fee1a46b.chunk.js.map