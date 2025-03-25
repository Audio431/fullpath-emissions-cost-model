function webrequest() {  
    let xhr = new XMLHttpRequest();
    let result = document.getElementById('result');
    xhr.open('GET', 'https://jsonplaceholder.typicode.com/posts', true);
    xhr.onreadystatechange = function() {
        result.innerHTML = xhr.responseText;
    }
    xhr.send();
    console.log('Web request sent!');
}

function onClick() {
    var btn = document.getElementById('btn');
    btn.addEventListener('click', webrequest);
}

document.addEventListener('DOMContentLoaded', onClick);
