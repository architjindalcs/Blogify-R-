var formf=document.querySelector(".formfinal");
var a=document.querySelector(".aaa");
a.addEventListener("click",function()
{
    console.log("I am clicked...");
    console.log(formf);
  formf.classList.toggle("hide");
  formf.classList.toggle("visi");
})
var cs=document.querySelectorAll(".commentsection");
var th=document.querySelectorAll(".tohide");
console.log(cs,th);
for(var i=0;i<cs.length;i++)
{
  cs[i].addEventListener("click",function()
  {
    console.log(i);
    for(var j=0;j<th.length;j++)
    {
      // if(j==i)
      th[j].classList.toggle("hideit");
    }
    
    
  })
}
// cs.addEventListener("click",function()
// {
//   console.log(th);
//     console.log("I am clicked!!");
//     th.classList.toggle("hideit")
// })