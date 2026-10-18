import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

export class Jeffy implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jeffy',
		name: 'jeffy',
		icon: 'file:jeffy.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Classify text using Jeffy — frozen embeddings + logistic regression',
		defaults: { name: 'Jeffy' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'jeffyApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Classify',
						value: 'classify',
						action: 'Classify a text input',
						description: 'Classify a single text input using a pretrained task',
					},
					{
						name: 'Batch Classify',
						value: 'batchClassify',
						action: 'Classify multiple texts',
						description: 'Classify multiple text inputs in one request',
					},
					{
						name: 'List Capabilities',
						value: 'listCapabilities',
						action: 'List available classifiers',
						description: 'List all available classification tasks on the server',
					},
					{
						name: 'Health Check',
						value: 'healthCheck',
						action: 'Check server health',
						description: 'Check if the Jeffy server is running and ready',
					},
				],
				default: 'classify',
			},

			// --- Classify fields ---
			{
				displayName: 'Task',
				name: 'task',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTasks',
				},
				required: true,
				default: '',
				description: 'The classification task to use',
				displayOptions: {
					show: { operation: ['classify', 'batchClassify'] },
				},
			},
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				typeOptions: { rows: 3 },
				required: true,
				default: '',
				placeholder: 'e.g. I need to cancel my credit card',
				description: 'The text to classify',
				displayOptions: {
					show: { operation: ['classify'] },
				},
			},
			{
				displayName: 'Texts',
				name: 'texts',
				type: 'string',
				typeOptions: { rows: 5 },
				required: true,
				default: '',
				placeholder: 'One text per line, or a JSON array',
				description: 'Multiple texts to classify — one per line, or a JSON array of strings',
				displayOptions: {
					show: { operation: ['batchClassify'] },
				},
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: { operation: ['classify'] },
				},
				options: [
					{
						displayName: 'Confidence Threshold',
						name: 'threshold',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 },
						default: 0,
						description: 'Minimum confidence (0–1). Below this threshold, the result is marked out_of_scope instead of forcing a label.',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getTasks(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('jeffyApi');
				const baseUrl = (credentials.baseUrl as string).replace(/\/+$/, '');

				const response = await this.helpers.httpRequest({
					method: 'GET',
					url: `${baseUrl}/v1/capabilities`,
					headers: { Accept: 'application/json' },
				});

				return (response.capabilities as Array<{ task_id: string; name: string; n_classes: number }>)
					.map((cap) => ({
						name: `${cap.name} (${cap.task_id}, ${cap.n_classes} classes)`,
						value: cap.task_id,
					}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = await this.getCredentials('jeffyApi');
		const baseUrl = (credentials.baseUrl as string).replace(/\/+$/, '');
		const apiKey = credentials.apiKey as string;

		const headers: Record<string, string> = { 'Content-Type': 'application/json' };
		if (apiKey) {
			headers['Authorization'] = `Bearer ${apiKey}`;
		}

		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		if (operation === 'classify') {
			for (let i = 0; i < items.length; i++) {
				const task = this.getNodeParameter('task', i) as string;
				const text = this.getNodeParameter('text', i) as string;
				const options = this.getNodeParameter('options', i) as { threshold?: number };

				const body: Record<string, unknown> = { task, text };
				if (options.threshold) {
					body.threshold = options.threshold;
				}

				const response = await this.helpers.httpRequest({
					method: 'POST',
					url: `${baseUrl}/v1/predict`,
					body,
					headers,
				});

				returnData.push({ json: response as IDataObject });
			}
		} else if (operation === 'batchClassify') {
			const task = this.getNodeParameter('task', 0) as string;
			const textsRaw = this.getNodeParameter('texts', 0) as string;

			let texts: string[];
			try {
				texts = JSON.parse(textsRaw);
			} catch {
				texts = textsRaw.split('\n').map((t) => t.trim()).filter(Boolean);
			}

			const response = await this.helpers.httpRequest({
				method: 'POST',
				url: `${baseUrl}/v1/predict/batch`,
				body: { task, texts },
				headers,
			});

			const predictions = response.predictions as IDataObject[];
			for (const prediction of predictions) {
				returnData.push({ json: prediction });
			}
		} else if (operation === 'listCapabilities') {
			const response = await this.helpers.httpRequest({
				method: 'GET',
				url: `${baseUrl}/v1/capabilities`,
				headers,
			});

			const capabilities = response.capabilities as IDataObject[];
			for (const cap of capabilities) {
				returnData.push({ json: cap });
			}
		} else if (operation === 'healthCheck') {
			const response = await this.helpers.httpRequest({
				method: 'GET',
				url: `${baseUrl}/health`,
				headers,
			});

			returnData.push({ json: response as IDataObject });
		}

		return [returnData];
	}
}
