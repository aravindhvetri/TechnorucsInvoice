import { Async } from '@fluentui/react';
import { HttpClient, HttpClientResponse, IHttpClientOptions } from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';

const BASE_URL = 'http://localhost:3001';

export const getCustomersZoho = async (context: WebPartContext): Promise<any> => {
  // Corrected URL path to match the ZohoBookAPI server routes
  const url = `${BASE_URL}/api/zoho/customers?page=1&per_page=25&sort_column=created_time&sort_order=D`;

  const options: IHttpClientOptions = {
    mode: "cors",
    headers: {
      "Content-Type": "application/json"
    //   "Authorization": "Bearer 1000.585cd3a3ef099a2125024a22ace4b673.c0a4987a8396810e8314444a02ab2d69"
      // Authorization header removed as the local server handles tokens internally
    }
  };

  const response: HttpClientResponse = await context.httpClient.get(
    url,
    HttpClient.configurations.v1,
    options
  );

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.message || JSON.stringify(error));
    } catch (e) {
      const text = await response.text();
      throw new Error(text || response.statusText);
    }
  }

  return response.json();
};

export const exportToZoho = async (context: WebPartContext, data: any): Promise<any> => {
  // Corrected URL path to match the ZohoBookAPI server routes
  const url = `${BASE_URL}/api/zoho/invoices`;

  const options: IHttpClientOptions = {
    mode: "cors",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  };

  const response: HttpClientResponse = await context.httpClient.post(
    url,
    HttpClient.configurations.v1,
    options
  );

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.message || JSON.stringify(error));
    } catch (e) {
      const text = await response.text();
      throw new Error(text || response.statusText);
    }
  }

  return response.json();
};


export const CreateCustomerZoho = async (context: WebPartContext, data: any): Promise<any> => {
    const url = `${BASE_URL}/api/zoho/customers`;
    const options: IHttpClientOptions = {
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer 1000.d28bb73f4f880f44ae861263847607d8.d72bb521b615ebbc61958e0393fcc383"
        },
        body: JSON.stringify(data)
    };

    const response: HttpClientResponse = await context.httpClient.post(
        url,
        HttpClient.configurations.v1,
        options
    );
debugger
    // Read the body ONCE as text
    const text = await response.text();

    if (!response.ok) {
        // Try to parse as JSON for a cleaner error message, fallback to raw text
        try {
            const error = JSON.parse(text);
            throw new Error(error.message || JSON.stringify(error));
        } catch {
            throw new Error(text || response.statusText);
        }
    }

    // Parse the already-read text as JSON for the success response
    return JSON.parse(text);
};

export const CreateQuoteZoho = async (context: WebPartContext, data: any): Promise<any> => {
    const url = `${BASE_URL}/api/zoho/estimates`;
    const options: IHttpClientOptions = {
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer 1000.d28bb73f4f880f44ae861263847607d8.d72bb521b615ebbc61958e0393fcc383"
        },
        body: JSON.stringify(data)
    };
debugger
    const response: HttpClientResponse = await context.httpClient.post(
        url,
        HttpClient.configurations.v1,
        options
    );
debugger
    const text = await response.text();
debugger
    if (!response.ok) {
        try {
            const error = JSON.parse(text);
            throw new Error(error.message || JSON.stringify(error));
        } catch {
            throw new Error(text || response.statusText);
        }
    }

    return JSON.parse(text);
};



export const CreateInvoiceZoho = async (context: WebPartContext, data: any,attachment:any): Promise<any> => {
    const url = `${BASE_URL}/api/zoho/invoices?organization_id=60065863044`;
    const options: IHttpClientOptions = {
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer 1000.d28bb73f4f880f44ae861263847607d8.d72bb521b615ebbc61958e0393fcc383"
        },
        body: JSON.stringify(data)
    };
debugger
    const response: HttpClientResponse = await context.httpClient.post(
        url,
        HttpClient.configurations.v1,
        options
    );
debugger
    const text = await response.text();
debugger
    if (!response.ok) {
        try {
            const error = JSON.parse(text);
            throw new Error(error.message || JSON.stringify(error));
        } catch {
            throw new Error(text || response.statusText);
        }
    }
    const result = JSON.parse(text);

    // ── Upload attachments AFTER invoice is created ──────────────────────────
    // We need the invoice_id from the response to build the attachment URL.
    const zohoInvoiceId: string = result?.invoice?.invoice_id || result?.invoice_id || "";

    if (zohoInvoiceId && attachment && attachment.length > 0) {
        for (const file of attachment) {
            try {
                const attachUrl = `${BASE_URL}/api/zoho/invoices/${zohoInvoiceId}/attachment`;

                const formData = new FormData();
                formData.append("attachment", file.FileContent, file.FileName);

                // Do NOT set Content-Type — browser adds the multipart boundary automatically
                const attachOptions: IHttpClientOptions = {
                    mode: "cors",
                    headers: {
                        "Authorization": "Bearer 1000.d28bb73f4f880f44ae861263847607d8.d72bb521b615ebbc61958e0393fcc383"
                    },
                    body: formData as any
                };

                const attachResponse = await context.httpClient.post(
                    attachUrl,
                    HttpClient.configurations.v1,
                    attachOptions
                );

                if (attachResponse.ok) {
                    console.log(`[CreateInvoiceZoho] Attachment uploaded: ${file.FileName}`);
                } else {
                    const errText = await attachResponse.text();
                    console.error(`[CreateInvoiceZoho] Attachment failed "${file.FileName}":`, errText);
                }
            } catch (err) {
                console.error(`[CreateInvoiceZoho] Error uploading "${file.FileName}":`, err);
            }
        }
    }

    return result;
};



export const UpdateCustomerZoho = async (context: WebPartContext, ZohoCustomerId: string, data: any): Promise<any> => {
    const url = `${BASE_URL}/api/zoho/customers/${ZohoCustomerId}`;
    const options: IHttpClientOptions = {
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer 1000.d28bb73f4f880f44ae861263847607d8.d72bb521b615ebbc61958e0393fcc383"
        },
        body: JSON.stringify(data)
    };

    const response: HttpClientResponse = await context.httpClient.fetch(
        url,
        HttpClient.configurations.v1,
        { ...options, method: "PUT" }
    );

    const text = await response.text();

    if (!response.ok) {
        try {
            const error = JSON.parse(text);
            throw new Error(error.message || JSON.stringify(error));
        } catch {
            throw new Error(text || response.statusText);
        }
    }

    // Parse the already-read text as JSON for the success response
    return JSON.parse(text);
};

export const UpdateInvoiceZoho = async (
    context: WebPartContext,
    zohoInvoiceId: string,
    data: any,
    attachment?: Array<{ FileName: string; FileContent: Blob }>
): Promise<any> => {
    // ── Step 1: Update the invoice (PUT) ────────────────────────────────────
    const url = `${BASE_URL}/api/zoho/invoices/${zohoInvoiceId}`;
    const options: IHttpClientOptions = {
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer 1000.d28bb73f4f880f44ae861263847607d8.d72bb521b615ebbc61958e0393fcc383"
        },
        body: JSON.stringify(data)
    };

    const response: HttpClientResponse = await context.httpClient.fetch(
        url,
        HttpClient.configurations.v1,
        { ...options, method: "PUT" }
    );

    const text = await response.text();

    if (!response.ok) {
        try {
            const error = JSON.parse(text);
            throw new Error(error.message || JSON.stringify(error));
        } catch {
            throw new Error(text || response.statusText);
        }
    }

    const result = JSON.parse(text);

    // ── Step 2: Upload attachments (if any) ─────────────────────────────────
    if (zohoInvoiceId && attachment && attachment.length > 0) {
        for (const file of attachment) {
            try {
                const attachUrl = `${BASE_URL}/api/zoho/invoices/${zohoInvoiceId}/attachment`;

                const formData = new FormData();
                formData.append("attachment", file.FileContent, file.FileName);

                // Do NOT set Content-Type — browser sets multipart boundary automatically
                const attachOptions: IHttpClientOptions = {
                    mode: "cors",
                    headers: {
                        "Authorization": "Bearer 1000.d28bb73f4f880f44ae861263847607d8.d72bb521b615ebbc61958e0393fcc383"
                    },
                    body: formData as any
                };

                const attachResponse = await context.httpClient.post(
                    attachUrl,
                    HttpClient.configurations.v1,
                    attachOptions
                );

                if (attachResponse.ok) {
                    console.log(`[UpdateInvoiceZoho] Attachment uploaded: ${file.FileName}`);
                } else {
                    const errText = await attachResponse.text();
                    console.error(`[UpdateInvoiceZoho] Attachment failed "${file.FileName}":`, errText);
                }
            } catch (err) {
                console.error(`[UpdateInvoiceZoho] Error uploading "${file.FileName}":`, err);
            }
        }
    }

    return result;
};
