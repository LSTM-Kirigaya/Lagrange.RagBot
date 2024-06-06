
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

class LinearEnn(nn.Module):
    in_dim: int
    out_dim: int
    alpha_kl: float
    def __init__(self, in_dim: int, out_dim: int, focal: int, alpha_kl: float):
        super().__init__()
        self.in_dim = in_dim
        self.out_dim = out_dim
        self.alpha_kl = alpha_kl
        self.focal = focal
        self.classifier = nn.Sequential(
            nn.Linear(in_dim, out_dim),
            nn.ELU(),
        )
    
    def forward(self, inputs: torch.FloatTensor) -> tuple[torch.FloatTensor, torch.FloatTensor]:
        logits = self.classifier(inputs)
        evidence = torch.exp(logits)
        prob = F.normalize(evidence + 1, p=1, dim=1)
        return evidence, prob

    def criterion(self, evidence: torch.FloatTensor, label: torch.LongTensor) -> torch.FloatTensor:
        if len(label.shape) == 1:
            label = F.one_hot(label, self.out_dim)
        alpha = evidence + 1
        alpha_0 = alpha.sum(1).unsqueeze(-1).repeat(1, self.out_dim)
        loss_ece = torch.sum(label * (torch.digamma(alpha_0) - torch.digamma(alpha)), dim=1)
        loss_ece = torch.mean(loss_ece)
        if self.alpha_kl > 0:
            tilde_alpha = label + (1 - label) * alpha
            uncertainty_alpha = torch.ones_like(tilde_alpha).cuda()
            estimate_dirichlet = torch.distributions.Dirichlet(tilde_alpha)
            uncertainty_dirichlet = torch.distributions.Dirichlet(uncertainty_alpha)
            kl = torch.distributions.kl_divergence(estimate_dirichlet, uncertainty_dirichlet)
            loss_kl = torch.mean(kl)
        else:
            loss_kl = 0
        return loss_ece + self.alpha_kl * loss_kl

    def predict(self, inputs: torch.FloatTensor | list[list[float]] | np.ndarray) -> tuple[torch.FloatTensor, torch.FloatTensor]:
        """
        返回每个类别的预测概率 和 当前的预测的不确定度 uncertainty
        """
        if not isinstance(inputs, torch.FloatTensor):
            inputs = torch.FloatTensor(inputs)
        with torch.no_grad():
            evidence, prob = self.forward(inputs)
            alpha = evidence + 1
            S = alpha.sum(dim=1)
            u = self.out_dim / S
            
        return prob, u


def train_enn(enn_model: LinearEnn, embedding: np.ndarray | torch.FloatTensor, labels: np.ndarray | torch.LongTensor, bs: int = 64, lr: float = 1e-3, epoch: int = 100):
    optimizer = torch.optim.AdamW(enn_model.parameters(), lr=lr)

    sample_num = len(embedding)
    sample_indice = np.arange(sample_num)
    bs_num = int(np.ceil(sample_num / bs))

    training_losses = []

    for i in range(epoch):
        alpha_kl = min(0.9, i / 10)
        np.random.shuffle(sample_indice)    
        train_loss = 0
        for bs_i in range(bs_num):
            start = bs_i * bs
            end = min(sample_num, start + bs)
            data_indice = sample_indice[start: end]
            data = torch.FloatTensor(embedding[data_indice])
            label = torch.LongTensor(labels[data_indice])
            evidence, prob = enn_model(data)
            loss = enn_model.criterion(evidence, label)
            train_loss += loss.item()
            
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

        training_losses.append(train_loss / bs_num)