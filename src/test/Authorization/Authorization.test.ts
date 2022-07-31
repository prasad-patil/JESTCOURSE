import { Authorizer } from "../../app/Authorization/Authorizer"
import { SessionTokenDBAccess } from "../../app/Authorization/SessionTokenDBAccess";
import { UserCredentialsDbAccess } from "../../app/Authorization/UserCredentialsDbAccess";
import { Account, SessionToken, TokenState } from "../../app/Models/ServerModels";

jest.mock('../../app/Authorization/SessionTokenDBAccess');
jest.mock('../../app/Authorization/UserCredentialsDbAccess');

describe('authorizer test, suite', ()=>{
    let authorizer: Authorizer;
    
    const sessionTokenDBAccessMock = {
        storeSessionToken: jest.fn(),
        getToken: jest.fn()
    };
    const userCredentialsDBAccessMock = {
        getUserCredential: jest.fn()
    };

    const someAccountMock: Account = {
        username: 'someuser',
        password: 'pass'
    }

    beforeEach(()=>{
        authorizer = new Authorizer(
            sessionTokenDBAccessMock as any,
            userCredentialsDBAccessMock as any
        )
    });

    afterEach(()=>{
        jest.clearAllMocks();
    })

    test('constructor arguments', ()=>{
        new Authorizer();

        expect(SessionTokenDBAccess).toBeCalled();
        expect(UserCredentialsDbAccess).toBeCalled();
    });

    test('should return session token for valid credentials', async()=>{
        jest.spyOn(global.Math, 'random').mockReturnValueOnce(0);
        jest.spyOn(global.Date, 'now').mockReturnValueOnce(0);
        userCredentialsDBAccessMock.getUserCredential.mockReturnValueOnce({
            username: 'someuser',
            accessRights: [1, 2, 3]
        });

        const expectedSessionToken: SessionToken = {
            userName: 'someuser',
            accessRights: [1, 2, 3],
            valid: true,
            tokenId: '',
            expirationTime: new Date(1000 * 60 * 60)
        }

        // invoke
        const sessionToken = await authorizer.generateToken(someAccountMock);

        expect(sessionToken).toEqual(expectedSessionToken);
    });

    test('should return null if the account credentials are invalid', async()=>{
        userCredentialsDBAccessMock.getUserCredential.mockReturnValueOnce(null);

        const actualSessionToken = await authorizer.generateToken(someAccountMock);

        expect(actualSessionToken).toEqual(null);
    })

    test('should return reject if the account credentials has error', async()=>{
        userCredentialsDBAccessMock.getUserCredential.mockRejectedValue('error');

        const actualSessionToken = await authorizer.generateToken(someAccountMock);

        expect(actualSessionToken).toEqual('error');
    })

    describe('validate token tests', ()=>{
        test('should return accessrights if the token is valid', async()=>{
            const mockTokenId = 'someValidToken';
            const expectedSessionToken: SessionToken = {
                userName: 'someuser',
                accessRights: [1, 2, 3],
                valid: true,
                tokenId: 'someValidToken',
                expirationTime: new Date(Date.now() + 1000 * 60 * 60)
            }
            sessionTokenDBAccessMock.getToken.mockReturnValueOnce(expectedSessionToken);

            // invoke
            const token = await authorizer.validateToken(mockTokenId);

            expect(token).toEqual({
                accessRights: [1, 2, 3],
                state: TokenState.VALID
            })
        });

        test('should return accessRights empty if the token is expired', async()=>{
            const mockTokenId = 'someValidToken';
            const expectedSessionToken: SessionToken = {
                userName: 'someuser',
                accessRights: [1, 2, 3],
                valid: true,
                tokenId: 'someValidToken',
                expirationTime: new Date(1000 * 60 * 60)
            }
            sessionTokenDBAccessMock.getToken.mockReturnValueOnce(expectedSessionToken);

            // invoke
            const token = await authorizer.validateToken(mockTokenId);

            expect(token).toEqual({
                accessRights: [],
                state: TokenState.EXPIRED
            })
        });

        test('should return accessRights empty if the token is expired', async()=>{
            const mockTokenId = 'someValidToken';
            const expectedSessionToken: SessionToken | null = null
            sessionTokenDBAccessMock.getToken.mockReturnValueOnce(expectedSessionToken);

            // invoke
            const token = await authorizer.validateToken(mockTokenId);

            expect(token).toEqual({
                accessRights: [],
                state: TokenState.INVALID
            })
        })
    })

})