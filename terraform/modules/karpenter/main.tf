#============================================================================
# Karpenter Module - IAM Resources for Node Autoscaling
#============================================================================
# This module creates the necessary IAM roles and policies for Karpenter:
# 1. Karpenter Controller Role (IRSA) - for the Karpenter controller pods
# 2. Karpenter Node Role - for EC2 instances that Karpenter creates
# 3. Instance Profile - to attach the node role to EC2 instances
#============================================================================

data "aws_partition" "current" {}
data "aws_caller_identity" "current" {}

#============================================================================
# Karpenter Controller IAM Role (IRSA)
#============================================================================

# Trust policy for Karpenter controller (IRSA)
data "aws_iam_policy_document" "karpenter_controller_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = [var.oidc_provider_arn]
    }

    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "${var.oidc_provider}:sub"
      values   = ["system:serviceaccount:${var.karpenter_namespace}:karpenter"]
    }

    condition {
      test     = "StringEquals"
      variable = "${var.oidc_provider}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

# Karpenter controller role
resource "aws_iam_role" "karpenter_controller" {
  name               = "${var.cluster_name}-karpenter-controller"
  assume_role_policy = data.aws_iam_policy_document.karpenter_controller_assume_role.json

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_name}-karpenter-controller"
    }
  )
}

# Karpenter controller policy
data "aws_iam_policy_document" "karpenter_controller" {
  statement {
    sid    = "AllowScopedEC2InstanceAccessActions"
    effect = "Allow"
    actions = [
      "ec2:RunInstances",
      "ec2:CreateFleet"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:image/*",
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}::snapshot/*",
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:security-group/*",
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:subnet/*",
    ]
  }

  statement {
    sid    = "AllowScopedEC2LaunchTemplateAccessActions"
    effect = "Allow"
    actions = [
      "ec2:RunInstances",
      "ec2:CreateFleet"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:launch-template/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/kubernetes.io/cluster/${var.cluster_name}"
      values   = ["owned"]
    }

    condition {
      test     = "StringLike"
      variable = "aws:ResourceTag/karpenter.sh/nodepool"
      values   = ["*"]
    }
  }

  statement {
    sid    = "AllowScopedEC2InstanceActionsWithTags"
    effect = "Allow"
    actions = [
      "ec2:RunInstances",
      "ec2:CreateFleet",
      "ec2:CreateLaunchTemplate"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:fleet/*",
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:instance/*",
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:volume/*",
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:network-interface/*",
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:launch-template/*",
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:spot-instances-request/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestTag/kubernetes.io/cluster/${var.cluster_name}"
      values   = ["owned"]
    }

    condition {
      test     = "StringLike"
      variable = "aws:RequestTag/karpenter.sh/nodepool"
      values   = ["*"]
    }
  }

  statement {
    sid    = "AllowScopedResourceCreationTagging"
    effect = "Allow"
    actions = [
      "ec2:CreateTags"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:fleet/*",
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:instance/*",
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:volume/*",
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:network-interface/*",
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:launch-template/*",
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:spot-instances-request/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestTag/kubernetes.io/cluster/${var.cluster_name}"
      values   = ["owned"]
    }

    condition {
      test     = "StringEquals"
      variable = "ec2:CreateAction"
      values = [
        "RunInstances",
        "CreateFleet",
        "CreateLaunchTemplate"
      ]
    }

    condition {
      test     = "StringLike"
      variable = "aws:RequestTag/karpenter.sh/nodepool"
      values   = ["*"]
    }
  }

  statement {
    sid    = "AllowScopedResourceTagging"
    effect = "Allow"
    actions = [
      "ec2:CreateTags"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:instance/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/kubernetes.io/cluster/${var.cluster_name}"
      values   = ["owned"]
    }

    condition {
      test     = "StringLike"
      variable = "aws:ResourceTag/karpenter.sh/nodepool"
      values   = ["*"]
    }

    condition {
      test     = "ForAllValues:StringEquals"
      variable = "aws:TagKeys"
      values = [
        "karpenter.sh/nodeclaim",
        "Name"
      ]
    }
  }

  statement {
    sid    = "AllowScopedDeletion"
    effect = "Allow"
    actions = [
      "ec2:TerminateInstances",
      "ec2:DeleteLaunchTemplate"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:instance/*",
      "arn:${data.aws_partition.current.partition}:ec2:${var.region}:*:launch-template/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/kubernetes.io/cluster/${var.cluster_name}"
      values   = ["owned"]
    }

    condition {
      test     = "StringLike"
      variable = "aws:ResourceTag/karpenter.sh/nodepool"
      values   = ["*"]
    }
  }

  statement {
    sid    = "AllowRegionalReadActions"
    effect = "Allow"
    actions = [
      "ec2:DescribeAvailabilityZones",
      "ec2:DescribeImages",
      "ec2:DescribeInstances",
      "ec2:DescribeInstanceTypeOfferings",
      "ec2:DescribeInstanceTypes",
      "ec2:DescribeLaunchTemplates",
      "ec2:DescribeSecurityGroups",
      "ec2:DescribeSpotPriceHistory",
      "ec2:DescribeSubnets"
    ]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.region]
    }
  }

  statement {
    sid    = "AllowSSMReadActions"
    effect = "Allow"
    actions = [
      "ssm:GetParameter"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:ssm:${var.region}::parameter/aws/service/*"
    ]
  }

  statement {
    sid    = "AllowPricingReadActions"
    effect = "Allow"
    actions = [
      "pricing:GetProducts"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "AllowInterruptionQueueActions"
    effect = "Allow"
    actions = [
      "sqs:DeleteMessage",
      "sqs:GetQueueUrl",
      "sqs:ReceiveMessage"
    ]
    resources = [aws_sqs_queue.karpenter.arn]
  }

  statement {
    sid    = "AllowPassingInstanceRole"
    effect = "Allow"
    actions = [
      "iam:PassRole"
    ]
    resources = [aws_iam_role.karpenter_node.arn]
  }

  statement {
    sid    = "AllowScopedInstanceProfileCreationActions"
    effect = "Allow"
    actions = [
      "iam:CreateInstanceProfile"
    ]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestTag/kubernetes.io/cluster/${var.cluster_name}"
      values   = ["owned"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:RequestTag/topology.kubernetes.io/region"
      values   = [var.region]
    }

    condition {
      test     = "StringLike"
      variable = "aws:RequestTag/karpenter.k8s.aws/ec2nodeclass"
      values   = ["*"]
    }
  }

  statement {
    sid    = "AllowScopedInstanceProfileTagActions"
    effect = "Allow"
    actions = [
      "iam:TagInstanceProfile"
    ]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/kubernetes.io/cluster/${var.cluster_name}"
      values   = ["owned"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/topology.kubernetes.io/region"
      values   = [var.region]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:RequestTag/kubernetes.io/cluster/${var.cluster_name}"
      values   = ["owned"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:RequestTag/topology.kubernetes.io/region"
      values   = [var.region]
    }

    condition {
      test     = "StringLike"
      variable = "aws:ResourceTag/karpenter.k8s.aws/ec2nodeclass"
      values   = ["*"]
    }

    condition {
      test     = "StringLike"
      variable = "aws:RequestTag/karpenter.k8s.aws/ec2nodeclass"
      values   = ["*"]
    }
  }

  statement {
    sid    = "AllowScopedInstanceProfileActions"
    effect = "Allow"
    actions = [
      "iam:AddRoleToInstanceProfile",
      "iam:RemoveRoleFromInstanceProfile",
      "iam:DeleteInstanceProfile"
    ]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/kubernetes.io/cluster/${var.cluster_name}"
      values   = ["owned"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/topology.kubernetes.io/region"
      values   = [var.region]
    }

    condition {
      test     = "StringLike"
      variable = "aws:ResourceTag/karpenter.k8s.aws/ec2nodeclass"
      values   = ["*"]
    }
  }

  statement {
    sid    = "AllowInstanceProfileReadActions"
    effect = "Allow"
    actions = [
      "iam:GetInstanceProfile"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "AllowAPIServerEndpointDiscovery"
    effect = "Allow"
    actions = [
      "eks:DescribeCluster"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:eks:${var.region}:${data.aws_caller_identity.current.account_id}:cluster/${var.cluster_name}"
    ]
  }
}

resource "aws_iam_policy" "karpenter_controller" {
  name        = "${var.cluster_name}-KarpenterController"
  description = "Policy for Karpenter controller"
  policy      = data.aws_iam_policy_document.karpenter_controller.json

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_name}-KarpenterController"
    }
  )
}

resource "aws_iam_role_policy_attachment" "karpenter_controller" {
  role       = aws_iam_role.karpenter_controller.name
  policy_arn = aws_iam_policy.karpenter_controller.arn
}

#============================================================================
# Karpenter Node IAM Role
#============================================================================

# Trust policy for Karpenter nodes
data "aws_iam_policy_document" "karpenter_node_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

# Karpenter node role
resource "aws_iam_role" "karpenter_node" {
  name               = "${var.cluster_name}-karpenter-node"
  assume_role_policy = data.aws_iam_policy_document.karpenter_node_assume_role.json

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_name}-karpenter-node"
    }
  )
}

# Attach required AWS managed policies for EKS nodes
resource "aws_iam_role_policy_attachment" "karpenter_node_worker" {
  role       = aws_iam_role.karpenter_node.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "karpenter_node_cni" {
  role       = aws_iam_role.karpenter_node.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "karpenter_node_ecr" {
  role       = aws_iam_role.karpenter_node.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy_attachment" "karpenter_node_ssm" {
  role       = aws_iam_role.karpenter_node.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance profile for Karpenter nodes
resource "aws_iam_instance_profile" "karpenter_node" {
  name = "${var.cluster_name}-karpenter-node"
  role = aws_iam_role.karpenter_node.name

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_name}-karpenter-node"
    }
  )
}

#============================================================================
# SQS Queue for Spot Interruption Notifications
#============================================================================

resource "aws_sqs_queue" "karpenter" {
  name                      = "${var.cluster_name}-karpenter"
  message_retention_seconds = 300
  sqs_managed_sse_enabled   = true

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_name}-karpenter"
    }
  )
}

resource "aws_sqs_queue_policy" "karpenter" {
  queue_url = aws_sqs_queue.karpenter.url
  policy    = data.aws_iam_policy_document.karpenter_queue.json
}

data "aws_iam_policy_document" "karpenter_queue" {
  statement {
    sid     = "EC2InterruptionPolicy"
    effect  = "Allow"
    actions = ["sqs:SendMessage"]

    principals {
      type = "Service"
      identifiers = [
        "events.amazonaws.com",
        "sqs.amazonaws.com"
      ]
    }

    resources = [aws_sqs_queue.karpenter.arn]
  }
}

#============================================================================
# EventBridge Rules for Interruption Handling
#============================================================================

# Spot instance interruption warning
resource "aws_cloudwatch_event_rule" "spot_interruption" {
  name        = "${var.cluster_name}-karpenter-spot-interruption"
  description = "Spot instance interruption warnings"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["EC2 Spot Instance Interruption Warning"]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_name}-karpenter-spot-interruption"
    }
  )
}

resource "aws_cloudwatch_event_target" "spot_interruption" {
  rule      = aws_cloudwatch_event_rule.spot_interruption.name
  target_id = "KarpenterInterruptionQueueTarget"
  arn       = aws_sqs_queue.karpenter.arn
}

# Instance rebalance recommendation
resource "aws_cloudwatch_event_rule" "rebalance_recommendation" {
  name        = "${var.cluster_name}-karpenter-rebalance"
  description = "EC2 instance rebalance recommendation"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["EC2 Instance Rebalance Recommendation"]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_name}-karpenter-rebalance"
    }
  )
}

resource "aws_cloudwatch_event_target" "rebalance_recommendation" {
  rule      = aws_cloudwatch_event_rule.rebalance_recommendation.name
  target_id = "KarpenterInterruptionQueueTarget"
  arn       = aws_sqs_queue.karpenter.arn
}

# Instance state change
resource "aws_cloudwatch_event_rule" "instance_state_change" {
  name        = "${var.cluster_name}-karpenter-state-change"
  description = "EC2 instance state-change notification"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["EC2 Instance State-change Notification"]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_name}-karpenter-state-change"
    }
  )
}

resource "aws_cloudwatch_event_target" "instance_state_change" {
  rule      = aws_cloudwatch_event_rule.instance_state_change.name
  target_id = "KarpenterInterruptionQueueTarget"
  arn       = aws_sqs_queue.karpenter.arn
}

# Scheduled change
resource "aws_cloudwatch_event_rule" "scheduled_change" {
  name        = "${var.cluster_name}-karpenter-scheduled-change"
  description = "AWS Health scheduled change event"

  event_pattern = jsonencode({
    source      = ["aws.health"]
    detail-type = ["AWS Health Event"]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_name}-karpenter-scheduled-change"
    }
  )
}

resource "aws_cloudwatch_event_target" "scheduled_change" {
  rule      = aws_cloudwatch_event_rule.scheduled_change.name
  target_id = "KarpenterInterruptionQueueTarget"
  arn       = aws_sqs_queue.karpenter.arn
}
