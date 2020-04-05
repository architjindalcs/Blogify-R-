var formc=document.querySelectorAll(".formc");
var a=document.querySelector(".aaa");
a.addEventListener("click",function()
{
    for(var i=0;i<formc.length;i++)
    {
        formc[i].classList.toggle("vis");
    }
    // formc.style.display="block";
})