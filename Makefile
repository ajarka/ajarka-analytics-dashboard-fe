# GITHUB_TOKEN ?= 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
GITHUB_TOKEN ?= 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
IMAGE ?= telcodash-fe
build:
	docker buildx build --build-arg GITHUB_TOKEN=${GITHUB_TOKEN} -t ${IMAGE} .