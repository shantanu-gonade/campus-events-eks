# GitHub OIDC Module

This Terraform module creates an IAM OpenID Connect (OIDC) provider and IAM role for GitHub Actions to authenticate with AWS without long-lived credentials.

## Features

- ✅ Creates GitHub OIDC provider in AWS
- ✅ Creates IAM role that GitHub Actions can assume
- ✅ Restricts access to specific GitHub repository
- ✅ Provides ECR push permissions
- ✅ No long-lived AWS credentials needed
- ✅ Secure authentication using OIDC tokens

## Usage

```hcl
module "github_oidc" {
  source = "../../modules/github-oidc"

  github_org  = "your-github-username"
  github_repo = "your-repo-name"
  role_name   = "GitHubActionsRole"

  ecr_repository_arns = [
    "arn:aws:ecr:us-east-1:123456789012:repository/campus-events/frontend",
    "arn:aws:ecr:us-east-1:123456789012:repository/campus-events/events-api",
    "arn:aws:ecr:us-east-1:123456789012:repository/campus-events/notification-service"
  ]

  tags = {
    Environment = "dev"
    Project     = "campus-events"
    ManagedBy   = "terraform"
  }
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| github_org | GitHub organization or username | string | - | yes |
| github_repo | GitHub repository name | string | - | yes |
| role_name | Name of the IAM role for GitHub Actions | string | "GitHubActionsRole" | no |
| ecr_repository_arns | List of ECR repository ARNs | list(string) | [] | no |
| tags | Tags to apply to resources | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| oidc_provider_arn | ARN of the GitHub OIDC provider |
| role_arn | ARN of the IAM role for GitHub Actions |
| role_name | Name of the IAM role |

## GitHub Actions Workflow Configuration

After deploying this module, configure your GitHub Actions workflow:

```yaml
name: Build and Push
on: [push]

permissions:
  id-token: write   # Required for OIDC
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1
      
      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2
```

## Security Features

### Trust Policy Restrictions

The IAM role can only be assumed by:
- GitHub's OIDC provider
- Your specific GitHub repository
- Any branch/tag/environment in that repository

### Least Privilege Permissions

The role includes only necessary ECR permissions:
- Get authorization token
- Push/pull images
- Describe repositories

### No Long-Lived Credentials

- No AWS access keys needed
- Temporary credentials generated per workflow run
- Credentials expire after 1 hour

## Repository-Specific Access

The trust policy uses the `sub` claim to restrict access:

```json
{
  "Condition": {
    "StringLike": {
      "token.actions.githubusercontent.com:sub": "repo:org/repo:*"
    }
  }
}
```

This allows access from:
- ✅ `repo:org/repo:ref:refs/heads/main`
- ✅ `repo:org/repo:ref:refs/tags/v1.0.0`
- ✅ `repo:org/repo:environment:production`
- ❌ `repo:other-org/other-repo:*` (denied)

## Requirements

| Name | Version |
|------|---------|
| terraform | >= 1.0 |
| aws | >= 5.0 |

## Resources Created

- `aws_iam_openid_connect_provider.github` - GitHub OIDC provider
- `aws_iam_role.github_actions` - IAM role for GitHub Actions
- `aws_iam_role_policy.ecr_push` - Inline policy for ECR access

## Notes

- GitHub is a trusted OIDC provider in AWS - no thumbprint needed
- The OIDC provider is shared across all GitHub Actions in your account
- Each repository should have its own IAM role for isolation
- Session duration is set to 1 hour (3600 seconds)

## Troubleshooting

### Error: "Not authorized to perform sts:AssumeRoleWithWebIdentity"

**Cause:** Trust policy mismatch  
**Solution:** Verify `github_org` and `github_repo` match your repository exactly

### Error: "Access Denied" when pushing to ECR

**Cause:** Missing ECR repository ARN  
**Solution:** Add all ECR repository ARNs to `ecr_repository_arns` variable

### Workflow fails with "No valid credentials"

**Cause:** OIDC token permissions missing  
**Solution:** Add `id-token: write` to workflow permissions

## References

- [AWS IAM OIDC Documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [AWS GitHub Actions](https://github.com/aws-actions/configure-aws-credentials)
