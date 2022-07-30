import { IncomingMessage, ServerResponse } from "http";
import { UsersDBAccess } from "../../app/Data/UsersDBAccess";
import { DataHandler } from "../../app/Handlers/DataHandler";
import { HTTP_CODES, HTTP_METHODS, TokenState, TokenValidator } from "../../app/Models/ServerModels";
import { Utils } from "../../app/Utils/Utils";

describe('test for datatHandler', ()=> {

    const requestMock = {
        method: '',
        headers: {
            authorization: ''
        }
    };
    const responseMock = {
        statusCode: '',
        writeHead: jest.fn(),
        write: jest.fn()
    };
    const tokenValidatorMock = {
        validateToken: jest.fn()
    };
    const usersDBAccessMOck = {
        getUsersByName: jest.fn()
    };
    let dataHandler : DataHandler;

    const operationAuthorizedMock = jest.fn();
    const parseUrlMock = jest.fn();
    const parseUrl = {
        query: {
            name: 'someName'
        }
    };
    const usersListMock = [
        {"age":21,"email":"some@email.com","id":"someId1","name":"someName1","workingPosition":2,"_id":"7EUY75b8z4ZMIdHR"}
    ];

    const validTokenMock = {
        accessRights: [1, 2, 3],
        state: TokenState.VALID
    }

    beforeEach(()=>{
        dataHandler = new DataHandler(
            requestMock as any,
            responseMock as any,
            tokenValidatorMock as any, 
            usersDBAccessMOck as any);
        Utils.parseUrl = parseUrlMock;
       // dataHandler.operationAuthorized = operationAuthorizedMock; // not correct way since the method is private
    });

    afterEach(()=>{
        jest.clearAllMocks();
    });
    

    test('handler options request', async()=>{
        // mock
        requestMock.method = HTTP_METHODS.OPTIONS;

        // invoke
        await dataHandler.handleRequest();

        // expect
        expect(responseMock.writeHead).toBeCalledWith(HTTP_CODES.OK)
    });

    test('handle invalid request', async ()=>{
        requestMock.method = 'something';

        await dataHandler.handleRequest();

        expect(responseMock.writeHead).not.toBeCalled();
    });

    test('handle valid get request and authorized', async()=>{
        requestMock.method = HTTP_METHODS.GET;
        //operationAuthorizedMock.mockReturnValueOnce(true);
        requestMock.headers.authorization = 'someValidTokenId';
        tokenValidatorMock.validateToken.mockReturnValueOnce(validTokenMock);
        parseUrlMock.mockReturnValueOnce(parseUrl);
        usersDBAccessMOck.getUsersByName.mockReturnValueOnce(usersListMock);

        //invoke
        await dataHandler.handleRequest();

        expect(responseMock.writeHead).toBeCalledWith(HTTP_CODES.OK, { 'Content-Type': 'application/json' });
        expect(responseMock.write).toBeCalledWith(JSON.stringify(usersListMock));
    });

    test('handle valid get request with unauthorized', async ()=>{
        requestMock.method = HTTP_METHODS.GET;
        requestMock.headers.authorization = 'invalidToken';
        tokenValidatorMock.validateToken.mockReturnValueOnce({
            accessRights: [],
            state: TokenState.INVALID
        });

        // invoke
        await dataHandler.handleRequest();

        //expect
        expect(responseMock.statusCode).toBe(HTTP_CODES.UNAUTHORIZED);
        expect(responseMock.write).toBeCalledWith('Unauthorized operation!');
    });

    test('handle valid get request with unauthorized with empty token', async ()=>{
        requestMock.method = HTTP_METHODS.GET;
        requestMock.headers.authorization = '';

        // invoke
        await dataHandler.handleRequest();

        //expect
        expect(responseMock.statusCode).toBe(HTTP_CODES.UNAUTHORIZED);
        expect(responseMock.write).toBeCalledWith('Unauthorized operation!');
    });

    test('handle users get request to not pass query params with name', async()=>{
        requestMock.method = HTTP_METHODS.GET;
        requestMock.headers.authorization = 'someValidToken';
        tokenValidatorMock.validateToken.mockReturnValueOnce(validTokenMock);
        parseUrlMock.mockReturnValueOnce({
            query: {}
        });
        
        // invoke
        await dataHandler.handleRequest();

        expect(responseMock.statusCode).toBe(HTTP_CODES.BAD_REQUEST);
        expect(responseMock.write).toBeCalledWith('Missing name parameter in the request!');
    });

    test('handle get request should throw internal server error if rejecteed', async()=>{
        requestMock.method = HTTP_METHODS.GET;
        requestMock.headers.authorization = 'someValidToken';
        tokenValidatorMock.validateToken.mockRejectedValueOnce('error');

        await dataHandler.handleRequest();

        expect(responseMock.statusCode).toBe(HTTP_CODES.INTERNAL_SERVER_ERROR);
        //expect(responseMock.write).toBeCalledWith(('Internal error: ' + 'error'))

    })
})