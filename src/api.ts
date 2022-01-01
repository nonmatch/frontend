function findGetParameter(parameterName : string) {
    var result = null,
        tmp = [];
    window.location.search
        .substring(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

function getToken() {
    let param = findGetParameter('token');
    if (param != null) {
        localStorage.setItem('token', param);
        console.log('get token ', param);
        return param;
    }

    console.log('store token ', localStorage.getItem('token'));
    return localStorage.getItem('token');
}

let token:string | null = getToken();



async function get(url: string): Promise<any> {
    console.log('get request', url)
    let options:any = {};
    if (token != null) {
        options['headers'] = new Headers({
            'Authorization': 'Basic ' + token
        });
    }
    const res = await fetch(url, options);
    if (res.ok) {
        return res.json();
    } else {
        return res.json();
      /*  return new Promise((resolve, reject) => {
            reject(res)
        });*/
    }
}
async function post(url: string, data:any): Promise<any> {
    console.log('post request', url)
    let options:any = {method: 'POST', body: JSON.stringify(data)};
    if (token != null) {
        options['headers'] = new Headers({
            'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json' // TODO always
        });
    }
    const res = await fetch(url, options);
    if (res.ok) {
        return res.json();
    } else {
        return res.json();
      /*  return new Promise((resolve, reject) => {
            reject(res)
        });*/
    }
}

export {
    get,
    post
}