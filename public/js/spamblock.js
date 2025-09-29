function setCookie(name, value, minutes) {
 var expires = "";
 if (minutes) {
  var date = new Date();
  date.setTime(date.getTime() + (minutes * 60 * 1000));
  expires = "; expires=" + date.toUTCString();
 }
 document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
function getCookie(name) {
 var nameEQ = name + "=";
 var ca = document.cookie.split(';');
 for (var i = 0; i < ca.length; i++) {
  var c = ca[i];
  while (c.charAt(0) == ' ') c = c.substring(1, c.length);
  if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
 }
 return null;
}
$(document).ready(() => {
 let cookie = getCookie('submitted')
 const forms = document.getElementsByTagName('form')
 if (cookie) {
  Array.from(forms).forEach(el => $(el).find('button').attr("disabled", true))
 } else {
  Array.from(forms).forEach(el => $(el).find('button').removeAttr("disabled"))
 }
})
$('form').on('submit', (e) => {
 setCookie('submitted', true, 30)
})