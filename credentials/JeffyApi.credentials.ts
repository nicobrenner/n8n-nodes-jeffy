import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class JeffyApi implements ICredentialType {
	name = 'jeffyApi';
	displayName = 'Jeffy API';
	documentationUrl = 'https://jeffyclassify.com';
	icon: Icon = 'file:jeffy.svg';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://playground.jeffyclassify.com',
			placeholder: 'https://your-jeffy-server.com',
			description: 'The base URL of your Jeffy server',
			required: true,
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Optional API key if your Jeffy server requires authentication',
		},
	];

	// Jeffy needs no authentication by default, so only send a bearer token when
	// the user actually set one. A generic authenticate block would send a bare
	// "Bearer " on every request, which some reverse proxies reject outright.
	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		const apiKey = (credentials.apiKey as string | undefined)?.trim();

		if (apiKey) {
			requestOptions.headers = {
				...requestOptions.headers,
				Authorization: `Bearer ${apiKey}`,
			};
		}

		return requestOptions;
	}

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/health',
			method: 'GET',
		},
	};
}
