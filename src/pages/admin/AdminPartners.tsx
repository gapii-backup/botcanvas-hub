import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminPartners } from '@/hooks/useAdminPartners';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Eye, Loader2 } from 'lucide-react';

export default function AdminPartners() {
  const { partners, isLoading, updatePartnerStatus } = useAdminPartners();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (partner.company?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && partner.is_active) ||
      (statusFilter === 'inactive' && !partner.is_active);

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sl-SI', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const handleStatusToggle = async (id: string, currentStatus: boolean | null) => {
    await updatePartnerStatus(id, !currentStatus);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Partnerji</h1>
          <p className="text-muted-foreground">
            Upravljanje partnerjev in njihovih referalov
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Išči po imenu, emailu ali podjetju..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter po statusu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Vsi partnerji</SelectItem>
              <SelectItem value="active">Aktivni</SelectItem>
              <SelectItem value="inactive">Neaktivni</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Skupaj partnerjev</p>
            <p className="text-2xl font-bold">{partners.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Aktivnih partnerjev</p>
            <p className="text-2xl font-bold text-green-500">
              {partners.filter((p) => p.is_active).length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Skupni zaslužek</p>
            <p className="text-2xl font-bold">
              {formatCurrency(partners.reduce((sum, p) => sum + p.totalEarnings, 0))}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Ime</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Podjetje</TableHead>
                <TableHead>Promo koda</TableHead>
                <TableHead className="text-center">Aktivni referrali</TableHead>
                <TableHead className="text-right">Zaslužek</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredPartners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Ni najdenih partnerjev
                  </TableCell>
                </TableRow>
              ) : (
                filteredPartners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell>{partner.email}</TableCell>
                    <TableCell>{partner.company || '-'}</TableCell>
                    <TableCell>
                      {partner.promo_code ? (
                        <Badge variant="secondary" className="font-mono">
                          {partner.promo_code}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{partner.activeReferrals}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(partner.totalEarnings)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={partner.is_active ?? false}
                        onCheckedChange={() =>
                          handleStatusToggle(partner.id, partner.is_active)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
