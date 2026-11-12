/**
 * Active par défaut les flux MVP autonomes lorsque les conventions
 * télécoms / bancaires de production ne sont pas encore raccordées.
 * Définir MVP_SIMULATION_MODE=false pour appliquer le mode strict fail-closed.
 */
export function isMvpSimulationEnabled(): boolean {
  return process.env.MVP_SIMULATION_MODE !== 'false';
}
