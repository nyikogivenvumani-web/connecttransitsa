/** T-US7-1, T-US7-2 (client) */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Organizations } from '../../components/Organizations';
import * as system from '../../lib/api/system';
import { mkOrg } from './fixturesPhase7';

jest.mock('../../lib/api/system', () => ({
  ...jest.requireActual('../../lib/api/system'),
  fetchOrganizations: jest.fn(), createOrganization: jest.fn(), updateOrganization: jest.fn(), createAdminUser: jest.fn(),
}));
const api = system as jest.Mocked<typeof system>;
const set = (id: string, value: string) => fireEvent.change(screen.getByTestId(id), { target: { value } });

beforeEach(() => {
  jest.clearAllMocks();
  api.fetchOrganizations.mockResolvedValue([mkOrg(), mkOrg({ id: 'o2', name: 'Other/Unregistered', is_oversight: true })]);
  api.createOrganization.mockResolvedValue(undefined);
  api.updateOrganization.mockResolvedValue(undefined);
  api.createAdminUser.mockResolvedValue(undefined);
});

it('T-US7-1 lists organizations and adds one', async () => {
  render(<Organizations />);
  await screen.findByTestId('org-edit-o1');
  set('org-name', 'Putco'); set('org-type', 'Bus');
  fireEvent.click(screen.getByTestId('org-add'));
  await waitFor(() => expect(api.createOrganization).toHaveBeenCalledWith('Putco', 'Bus'));
});

it('T-US7-1 shows the duplicate message', async () => {
  api.createOrganization.mockRejectedValue(new Error('That organization already exists.'));
  render(<Organizations />);
  await screen.findByTestId('org-edit-o1');
  set('org-name', 'DORLJOTA');
  fireEvent.click(screen.getByTestId('org-add'));
  expect(await screen.findByText('That organization already exists.')).toBeInTheDocument();
});

it('T-US7-1 edits an organization name', async () => {
  render(<Organizations />);
  fireEvent.click(await screen.findByTestId('org-edit-o1'));
  set('org-edit-name', 'DORLJOTA Taxis');
  fireEvent.click(screen.getByTestId('org-edit-save'));
  await waitFor(() => expect(api.updateOrganization).toHaveBeenCalledWith('o1', 'DORLJOTA Taxis', 'Taxi'));
});

it('does not allow editing the oversight organization', async () => {
  render(<Organizations />);
  await screen.findByText('Other/Unregistered');
  expect(screen.queryByTestId('org-edit-o2')).toBeNull();
});

it('T-US7-2 creates a Transport Admin with an organization', async () => {
  render(<Organizations />);
  await screen.findByTestId('org-edit-o1');
  set('admin-email', 'ayanda@example.co.za'); set('admin-name', 'Ayanda Zulu'); set('admin-role', 'transport_admin'); set('admin-org', 'o1');
  fireEvent.click(screen.getByTestId('admin-create'));
  await waitFor(() => expect(api.createAdminUser).toHaveBeenCalledWith({ email: 'ayanda@example.co.za', full_name: 'Ayanda Zulu', role: 'transport_admin', organization_id: 'o1' }));
  expect(await screen.findByText('Invitation sent to ayanda@example.co.za.')).toBeInTheDocument();
});

it('T-US7-2 needs an organization for a Transport Admin and none for SAPS', async () => {
  render(<Organizations />);
  await screen.findByTestId('org-edit-o1');
  set('admin-email', 'a@example.co.za'); set('admin-name', 'A B'); set('admin-role', 'transport_admin');
  expect(screen.getByTestId('admin-create')).toBeDisabled();
  set('admin-role', 'saps');
  expect(screen.queryByTestId('admin-org')).toBeNull();
  expect(screen.getByTestId('admin-create')).not.toBeDisabled();
});

it('T-US7-2 shows the server error', async () => {
  api.createAdminUser.mockRejectedValue(new Error('Something went wrong. Try again.'));
  render(<Organizations />);
  await screen.findByTestId('org-edit-o1');
  set('admin-email', 'a@example.co.za'); set('admin-name', 'A B'); set('admin-role', 'saps');
  fireEvent.click(screen.getByTestId('admin-create'));
  expect(await screen.findByText('Something went wrong. Try again.')).toBeInTheDocument();
});
