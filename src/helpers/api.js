import axios from "axios";
import {getServerAddress} from "../config/config";

export function apiGet(self, url, onSuccess, onError, onFinish){
    axios.get(getServerAddress() + url)
        .then(res => {
            onSuccess(res);
        }).catch(function (error) {
        onError(error, () => {
            self.setState({ error: "" });
            apiGet(self, url, onSuccess, onError, onFinish);
        });
    })
        .then(function () {
            onFinish();
        });
}

export function apiPost(self, url, data, onSuccess, onError, onFinish){
    axios.post(getServerAddress() + url, data,{
        headers: {
            'Access-Control-Allow-Origin': '*',
        }})
        .then(res => {
            onSuccess(res);
        }).catch(function (error) {
        onError(error, () => {
            self.setState({ error: "" });
            apiPost(self, url, data, onSuccess, onError, onFinish);
        });
    })
        .then(function () {
            onFinish();
        });
}

export function apiPut(self, url, data, onSuccess, onError, onFinish){
    const httpClient = axios.create();
    httpClient.defaults.timeout = 600000;

    httpClient.put(getServerAddress() + url, data, { timeout: 600000, headers: {
            'Access-Control-Allow-Origin': '*',
        }})
        .then(res => {
            onSuccess(res);
        }).catch(function (error) {
        onError(error, () => {
            self.setState({ error: "" });
            apiPut(self, url, data, onSuccess, onError, onFinish);
        });
    })
        .then(function () {
            onFinish();
        });
}

export function apiDelete(self, url, onSuccess, onError, onFinish){
    const httpClient = axios.create();
    httpClient.defaults.timeout = 600000;

    httpClient.delete(getServerAddress() + url, {}, { timeout: 600000, headers: {
            'Access-Control-Allow-Origin': '*',
        }})
        .then(res => {
            onSuccess(res);
        }).catch(function (error) {
        onError(error, () => {
            self.setState({ error: "" });
            apiPut(self, url, data, onSuccess, onError, onFinish);
        });
    })
        .then(function () {
            onFinish();
        });
}