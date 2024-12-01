import nock from 'nock';

import { TemplateType } from '@logto/connector-kit';

import createConnector from './index.js';
import { mockedConfig } from './mock.js';

const getConfig = vi.fn().mockResolvedValue(mockedConfig);

describe('HTTP email connector', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should init without throwing errors', async () => {
    await expect(createConnector({ getConfig })).resolves.not.toThrow();
  });

  it('should call endpoint with correct parameters', async () => {
    const url = new URL(mockedConfig.endpoint);
    const mockPost = nock(url.origin)
      .post(url.pathname, (body) => {
        expect(body).toMatchObject({
          to: 'foo@logto.io',
          type: TemplateType.SignIn,
          payload: {
            code: '123456',
          },
        });
        return true;
      })
      .reply(200, {
        message: 'Email sent successfully',
      });

    const connector = await createConnector({ getConfig });
    await connector.sendMessage({
      to: 'foo@logto.io',
      type: TemplateType.SignIn,
      payload: {
        code: '123456',
      },
    });

    expect(mockPost.isDone()).toBe(true);
  });
});
