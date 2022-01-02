
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

const verbose = false;

async function get(url: string): Promise<any> {
    if (verbose) {
        console.log('GET request', url)
    }
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
async function request(url: string, data:any, method: 'POST'|'PUT'): Promise<any> {
    if (verbose) {
        console.log(method+' request', url)
    }
    let options:any = {method: method, body: JSON.stringify(data)};
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

async function post(url: string, data:any): Promise<any> {
    return request(url, data, 'POST');
}
async function put(url: string, data:any): Promise<any> {
    return request(url, data, 'PUT');
}

export {
    get,
    post,
    put
}