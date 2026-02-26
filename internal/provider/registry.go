package provider

import (
	"context"
	"fmt"
	"log"
	"sync"
)

// Registry holds all active providers and indexes their models.
type Registry struct {
	mu        sync.RWMutex
	providers []Provider
	models    []ModelInfo
	modelIdx  map[string]Provider // modelID → provider
}

// NewRegistry creates an empty registry.
func NewRegistry() *Registry {
	return &Registry{
		modelIdx: make(map[string]Provider),
	}
}

// Register adds a provider and indexes its models.
func (r *Registry) Register(p Provider) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.providers = append(r.providers, p)

	models, err := p.ListModels(context.Background())
	if err != nil {
		log.Printf("provider: failed to list models for %s: %v", p.Name(), err)
		return
	}

	for _, m := range models {
		r.models = append(r.models, m)
		r.modelIdx[m.ID] = p
	}

	log.Printf("provider: registered %s with %d models", p.Name(), len(models))
}

// ProviderForModel returns the provider that serves the given model ID.
func (r *Registry) ProviderForModel(modelID string) (Provider, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	p, ok := r.modelIdx[modelID]
	if !ok {
		return nil, fmt.Errorf("no provider found for model %q", modelID)
	}
	return p, nil
}

// AllModels returns every model across all registered providers.
func (r *Registry) AllModels() []ModelInfo {
	r.mu.RLock()
	defer r.mu.RUnlock()

	out := make([]ModelInfo, len(r.models))
	copy(out, r.models)
	return out
}

// IsValidModel checks if a model ID is known to any provider.
func (r *Registry) IsValidModel(modelID string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	_, ok := r.modelIdx[modelID]
	return ok
}

// DefaultModel returns the first available model ID, or "" if none.
func (r *Registry) DefaultModel() string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if len(r.models) > 0 {
		return r.models[0].ID
	}
	return ""
}

// ProviderNames returns the names of all active providers.
func (r *Registry) ProviderNames() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	names := make([]string, len(r.providers))
	for i, p := range r.providers {
		names[i] = p.Name()
	}
	return names
}

// RefreshModels re-queries all providers and rebuilds the model index.
func (r *Registry) RefreshModels() {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.models = nil
	r.modelIdx = make(map[string]Provider)

	for _, p := range r.providers {
		models, err := p.ListModels(context.Background())
		if err != nil {
			log.Printf("provider: refresh failed for %s: %v", p.Name(), err)
			continue
		}
		for _, m := range models {
			r.models = append(r.models, m)
			r.modelIdx[m.ID] = p
		}
	}
}
