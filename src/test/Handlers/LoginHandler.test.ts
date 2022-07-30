import { LoginHandler } from "../../app/Handlers/LoginHandler"
import { HTTP_CODES, HTTP_METHODS, SessionToken } from "../../app/Models/ServerModels";
import { Utils } from '../../app/Utils/Utils';
import { Authorizer } from '../../app/Authorization/Authorizer';


describe('Login Handler test suite', ()=>{
    let loginHandler: LoginHandler;

    const requestMock = {
        method: ''
    };
    const responseMock = {
        writeHead: jest.fn(), //jest fn mock
        write: jest.fn(),
        statusCode: 0
    };
    const authorizerMock = {
        generateToken: jest.fn()
    };

    const getReqestBodyMock = jest.fn();

    const sessionToken: SessionToken = {
        accessRights: [1, 2, 3],
        expirationTime: new Date(),
        userName: 'someuser',
        valid: true,
        tokenId: 'token123'
    }

    beforeEach(()=>{
        loginHandler = new LoginHandler(
            requestMock as any,
            responseMock as any,
            authorizerMock as any
        );
        Utils.getRequestBody = getReqestBodyMock;
        
    });

    afterEach(()=>{
        jest.clearAllMocks();
    }) 

    test('options request', async ()=>{
        requestMock.method = HTTP_METHODS.OPTIONS;
        await loginHandler.handleRequest();
        expect(responseMock.writeHead).toBeCalledWith(HTTP_CODES.OK)
    })

    test('not handlled http method', async()=>{
        requestMock.method = 'someRandomMethod';
        await loginHandler.handleRequest();
        expect(responseMock.writeHead).not.toHaveBeenCalled();
    });

    test('request with valid login', async()=>{

        // mocking
        requestMock.method = HTTP_METHODS.POST;
        getReqestBodyMock.mockReturnValueOnce({
            userName: 'someuser',
            password: 'pass'
        });
        authorizerMock.generateToken.mockReturnValueOnce(sessionToken);

        // invoke method
        await loginHandler.handleRequest();

        // expect the result.
        expect(responseMock.statusCode).toBe(HTTP_CODES.CREATED);
        expect(responseMock.write).toBeCalledWith(JSON.stringify(sessionToken));
        expect(responseMock.writeHead).toBeCalledWith(HTTP_CODES.CREATED,  { 'Content-Type': 'application/json' })
    });

    test('request with invalid login', async ()=>{
        requestMock.method = HTTP_METHODS.POST;
        const requestBodyMock = getReqestBodyMock.mockReturnValueOnce({
            userName: 'someuser',
            password: 'pass'
        });
        authorizerMock.generateToken.mockReturnValueOnce(null);

        await loginHandler.handleRequest();

        expect(responseMock.statusCode).toBe(HTTP_CODES.NOT_fOUND);
        expect(responseMock.write).toBeCalledWith('wrong username or password');
    });

    test('request with unexpected error', async()=>{
        requestMock.method = HTTP_METHODS.POST;
        getReqestBodyMock.mockRejectedValueOnce('something went wrong');

        await loginHandler.handleRequest();

        expect(responseMock.statusCode).toBe(HTTP_CODES.INTERNAL_SERVER_ERROR);
      //  expect(responseMock.write).toBeCalledWith('Internal error: ' + 'something went wrong')
    });

})