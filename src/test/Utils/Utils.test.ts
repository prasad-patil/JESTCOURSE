import { IncomingMessage } from 'http';
import { Utils } from '../../app/Utils/Utils';

describe('Utils test suite', ()=>{
    test('getReqestPath valid request', ()=>{
        const request = {
            url: 'http://localhost:8000/login'
        } as IncomingMessage;
        const resultPath = Utils.getRequestBasePath(request);
        expect(resultPath).toBe('login');
    })

    test('getReqestPath empty path name', ()=>{
        const request = {url: 'http://localhost:8000/'} as IncomingMessage;
        const resultPath = Utils.getRequestBasePath(request);
        expect(resultPath).toBeFalsy();
    })

    test('getReqestPathName empty url', ()=>{
        const reqest = { url: ''} as IncomingMessage;
        const resultPath = Utils.getRequestBasePath(reqest);

        expect(resultPath).toBeFalsy();
    })


})