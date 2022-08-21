const verbose = false;

function findGetParameter(parameterName: string) {
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
        window.history.replaceState({}, document.title, window.location.pathname);
        return param;
    }

    if (verbose) {
        console.log('store token ', localStorage.getItem('token'));
    }
    return localStorage.getItem('token');
}

let token: string | null = getToken();

function resetToken() {
    localStorage.removeItem('token');
    token = null;
}


async function get(url: string): Promise<any> {
    if (verbose) {
        console.log('GET request', url)
    }
    let options: any = {};
    if (token != null) {
        options['headers'] = new Headers({
            'Authorization': 'Basic ' + token
        });
    }
    const res = await fetch(url, options);
    if (res.ok) {
        return res.json();
    } else {
        //        return res.json();
        return new Promise((resolve, reject) => {
            res.json().then(reject)
        });
    }
}
async function request(url: string, data: any, method: 'POST' | 'PUT' | 'DELETE'): Promise<any> {
    if (verbose) {
        console.log(method + ' request', url)
    }
    let options: any = { method: method, body: JSON.stringify(data) };
    options['headers'] = {
        'Content-Type': 'application/json'
    };
    if (token != null) {
        options['headers']['Authorization'] = 'Basic ' + token
    }
    const res = await fetch(url, options);
    if (res.ok) {
        return res.json();
    } else {
        return new Promise((resolve, reject) => {
            res.json().then(reject)
        });
    }
}

async function post(url: string, data: any): Promise<any> {
    return request(url, data, 'POST');
}
async function put(url: string, data: any): Promise<any> {
    return request(url, data, 'PUT');
}
async function sendDelete(url: string, data: any): Promise<any> {
    return request(url, data, 'DELETE');
}

export {
    get,
    post,
    put,
    sendDelete,
    resetToken
}