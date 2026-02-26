import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { groupModelsByProvider } from "@/lib/models";
import type { Model } from "@/types";
import type { ChatStatus } from "ai";
import { CheckIcon } from "lucide-react";
import { memo, useCallback, useState } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  isStreaming: boolean;
  onStop: () => void;
  models: Model[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  status: ChatStatus;
}

const providerSlugMap: Record<string, string> = {
  OpenAI: "openai",
  Anthropic: "anthropic",
  Google: "google",
  Groq: "groq",
  Mistral: "mistral",
  Cohere: "cohere",
  Ollama: "llama",
  "LM Studio": "lmstudio",
};

function getProviderSlug(provider: string): string {
  return providerSlugMap[provider] ?? provider.toLowerCase();
}

interface ModelItemProps {
  model: Model;
  selectedModel: string;
  onSelect: (id: string) => void;
}

const ModelItem = memo(({ model, selectedModel, onSelect }: ModelItemProps) => {
  const handleSelect = useCallback(
    () => onSelect(model.id),
    [onSelect, model.id],
  );
  const slug = getProviderSlug(model.provider);
  return (
    <ModelSelectorItem onSelect={handleSelect} value={model.id}>
      <ModelSelectorLogo provider={slug} />
      <ModelSelectorName>{model.name}</ModelSelectorName>
      <ModelSelectorLogoGroup>
        <ModelSelectorLogo provider={slug} />
      </ModelSelectorLogoGroup>
      {selectedModel === model.id ? (
        <CheckIcon className="ml-auto size-4" />
      ) : (
        <div className="ml-auto size-4" />
      )}
    </ModelSelectorItem>
  );
});
ModelItem.displayName = "ModelItem";

export default function ChatInput({
  onSend,
  onStop,
  models,
  selectedModel,
  onModelChange,
  status,
}: ChatInputProps) {
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const groups = groupModelsByProvider(models);

  const selectedModelData = models.find((m) => m.id === selectedModel);

  const handleModelSelect = useCallback(
    (id: string) => {
      onModelChange(id);
      setModelSelectorOpen(false);
    },
    [onModelChange],
  );

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (!message.text?.trim()) return;
      onSend(message.text);
    },
    [onSend],
  );

  return (
    <div className="border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <PromptInputProvider>
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea placeholder="Send a message" />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <ModelSelector
                  onOpenChange={setModelSelectorOpen}
                  open={modelSelectorOpen}
                >
                  <ModelSelectorTrigger asChild>
                    <PromptInputButton>
                      {selectedModelData && (
                        <ModelSelectorLogo
                          provider={getProviderSlug(
                            selectedModelData.provider,
                          )}
                        />
                      )}
                      {selectedModelData && (
                        <ModelSelectorName>
                          {selectedModelData.name}
                        </ModelSelectorName>
                      )}
                    </PromptInputButton>
                  </ModelSelectorTrigger>
                  <ModelSelectorContent>
                    <ModelSelectorInput placeholder="Search models..." />
                    <ModelSelectorList>
                      <ModelSelectorEmpty>
                        No models found.
                      </ModelSelectorEmpty>
                      {groups.map((group) => (
                        <ModelSelectorGroup
                          heading={group.provider}
                          key={group.provider}
                        >
                          {group.models.map((m) => (
                            <ModelItem
                              key={m.id}
                              model={m}
                              onSelect={handleModelSelect}
                              selectedModel={selectedModel}
                            />
                          ))}
                        </ModelSelectorGroup>
                      ))}
                    </ModelSelectorList>
                  </ModelSelectorContent>
                </ModelSelector>
              </PromptInputTools>
              <PromptInputSubmit status={status} onStop={onStop} />
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>
      </div>
    </div>
  );
}
