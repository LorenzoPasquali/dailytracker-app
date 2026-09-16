import React from 'react';
import KpiCard from '../../../components/charts/KpiCard';
import { useAdminQuery, fmt } from '../useAdminQuery';
import { Card, Loading, ErrorBox } from '../Shared';

export default function HealthSection() {
  const { data, loading, error } = useAdminQuery('/admin/analytics/health');
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  const d = data;

  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' };
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <Card title="Base">
        <div style={grid}>
          <KpiCard label="Contas" value={fmt.int(d.users)} color="var(--text-primary)" />
          <KpiCard label="Contas via Google" value={fmt.int(d.googleUsers)} color="var(--text-secondary)" />
          <KpiCard label="Workspaces" value={fmt.int(d.workspaces)} color="var(--text-primary)" />
          <KpiCard label="Workspaces de equipe" value={fmt.int(d.teamWorkspaces)} color="#8b5cf6" />
          <KpiCard label="Projetos" value={fmt.int(d.projects)} color="var(--text-secondary)" />
          <KpiCard label="Tasks" value={fmt.int(d.tasks)} color="var(--accent)" />
        </div>
      </Card>
      <Card title="Integrações">
        <div style={grid}>
          <KpiCard label="Tokens MCP ativos" value={fmt.int(d.mcpTokens)} color="var(--text-primary)" />
          <KpiCard label="Usuários com MCP" value={fmt.int(d.mcpUsers)} color="var(--accent)" />
          <KpiCard label="Autorizações OAuth" value={fmt.int(d.oauthAuthorizations)} color="var(--text-secondary)" />
        </div>
      </Card>
      <Card title="Notificações por e-mail (7 dias)">
        <div style={grid}>
          <KpiCard label="Enviadas" value={fmt.int(d.notificationsSent7d)} color="var(--accent)" />
          <KpiCard label="Falharam" value={fmt.int(d.notificationsFailed7d)} color={d.notificationsFailed7d ? 'var(--danger)' : 'var(--text-secondary)'} />
          <KpiCard label="Na fila" value={fmt.int(d.notificationsPending)} color="var(--text-secondary)" />
        </div>
      </Card>
      <Card title="Analytics">
        <div style={grid}>
          <KpiCard label="Pageviews armazenados" value={fmt.int(d.pageviewRows)} color="var(--text-secondary)" />
        </div>
      </Card>
    </div>
  );
}
