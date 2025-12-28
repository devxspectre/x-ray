import { CohereClient } from "cohere-ai";
import * as otel from "@opentelemetry/api";

const tracer = otel.trace.getTracer('cohere-instrumentation');

export function instrumentCohere(client: CohereClient): CohereClient {
  // Create a proxy to intercept calls
  return new Proxy(client, {
    get(target, prop, receiver) {
      const originalValue = Reflect.get(target, prop, receiver);
      
      // We only care about the 'chat' method for now
      if (prop === 'chat' && typeof originalValue === 'function') {
        return async function (this: any, ...args: any[]) {
          const params = args[0] || {};
          const originalMessage = params.message;

          // Inject reasoning instruction
          if (params.message && typeof params.message === 'string') {
            params.message = params.message + '\n\nIMPORTANT: After your response, please explain your reasoning. Start the explanation on a new line with "REASON: ".';
          }
          
          const span = tracer.startSpan('cohere.chat', {
            kind: otel.SpanKind.CLIENT,
            attributes: {
              'gen_ai.system': 'cohere',
              'gen_ai.request.model': params.model,
              'gen_ai.request.message': originalMessage, // Use original message
              'gen_ai.request.temperature': params.temperature,
            }
          });

          try {
            const result = await originalValue.apply(this, args);
            
            const text = result.text || '';
            // Regex to find "REASON:" (case insensitive, optional markdown) at start of line
            const reasonRegex = /(?:^|\n)(?:[\*_]{1,2})?REASON(?:[\*_]{1,2})?[:\s]+([\s\S]*?)$/i;
            const match = text.match(reasonRegex);
            
            const reason = match ? match[1].trim() : '';
            const cleanText = text.replace(reasonRegex, '').trim();

            span.setAttribute('gen_ai.response.text', cleanText); // Store clean text
            if (reason) {
                span.setAttribute('gen_ai.response.reasoning', reason); // Store reasoning
            }
            span.setAttribute('gen_ai.response.finish_reason', result.finishReason);
            span.setStatus({ code: otel.SpanStatusCode.OK });
            
            // Return the clean text to the application, hiding the injection artifact
            if (result.text) {
                result.text = cleanText;
            }
            return result;
          } catch (error: any) {
            span.recordException(error);
            span.setStatus({
              code: otel.SpanStatusCode.ERROR,
              message: error.message
            });
            throw error;
          } finally {
            span.end();
          }
        };
      }
      
      return originalValue;
    }
  });
}
