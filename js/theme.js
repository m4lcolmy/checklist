(function(){
  try{
    var pref = localStorage.getItem("checklist:theme") || "current";
    var isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var palette;
    if(pref === "light") palette = "light";
    else if(pref === "black") palette = "black";
    else if(pref === "system") palette = isDark ? "black" : "light";
    else palette = isDark ? "warm-dark" : "warm-light";
    if(palette !== "warm-light") document.documentElement.setAttribute("data-palette", palette);
  }catch(e){}
})();
