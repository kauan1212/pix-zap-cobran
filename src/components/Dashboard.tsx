
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { PlusCircle, Users, FileText, DollarSign, TrendingUp, Calendar, Zap } from 'lucide-react';
import ClientManager from './ClientManager';
import BillingManager from './BillingManager';
import { toast } from '@/hooks/use-toast';

interface Billing {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  description: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  pixCode?: string;
  createdAt: string;
}

const Dashboard = () => {
  const { user, logout, canCreateBilling } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [billings, setBillings] = useState<Billing[]>([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = () => {
    if (user) {
      const userBillings = JSON.parse(localStorage.getItem(`billings_${user.id}`) || '[]');
      const userClients = JSON.parse(localStorage.getItem(`clients_${user.id}`) || '[]');
      setBillings(userBillings);
      setClients(userClients);
    }
  };

  const getCurrentMonthBillings = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return billings.filter(billing => {
      const billingDate = new Date(billing.createdAt);
      return billingDate.getMonth() === currentMonth && billingDate.getFullYear() === currentYear;
    });
  };

  const monthlyBillings = getCurrentMonthBillings();
  const totalAmount = monthlyBillings.reduce((sum, billing) => sum + billing.amount, 0);
  const paidAmount = monthlyBillings.filter(b => b.status === 'paid').reduce((sum, billing) => sum + billing.amount, 0);
  const pendingAmount = monthlyBillings.filter(b => b.status === 'pending').reduce((sum, billing) => sum + billing.amount, 0);
  const overdueAmount = monthlyBillings.filter(b => b.status === 'overdue').reduce((sum, billing) => sum + billing.amount, 0);

  const handleUpgrade = () => {
    toast({
      title: "Upgrade para Premium",
      description: "Em breve você poderá fazer upgrade para o plano premium!",
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">₿</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                CobrançaPro
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={user.plan === 'premium' ? 'default' : 'secondary'} className="text-xs">
                    {user.plan === 'premium' ? 'Premium' : 'Gratuito'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {user.billingCount}/{user.maxBillings} cobranças
                  </span>
                </div>
              </div>
              <Button onClick={logout} variant="outline" size="sm">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="mb-8">
          <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'clients', label: 'Clientes', icon: Users },
              { id: 'billings', label: 'Cobranças', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Plan Status */}
            {user.plan === 'free' && (
              <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Zap className="w-8 h-8 text-yellow-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Upgrade para Premium</h3>
                        <p className="text-sm text-gray-600">
                          Cobranças ilimitadas, relatórios avançados e muito mais!
                        </p>
                      </div>
                    </div>
                    <Button onClick={handleUpgrade} className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                      Upgrade - R$ 19,90/mês
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total do Mês</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-gray-500">
                    {monthlyBillings.length} cobranças geradas
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Recebido</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-gray-500">
                    {monthlyBillings.filter(b => b.status === 'paid').length} pagas
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Pendente</CardTitle>
                  <Calendar className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-gray-500">
                    {monthlyBillings.filter(b => b.status === 'pending').length} pendentes
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Em Atraso</CardTitle>
                  <FileText className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    R$ {overdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-gray-500">
                    {monthlyBillings.filter(b => b.status === 'overdue').length} em atraso
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Billings */}
            <Card>
              <CardHeader>
                <CardTitle>Cobranças Recentes</CardTitle>
                <CardDescription>Suas últimas cobranças geradas</CardDescription>
              </CardHeader>
              <CardContent>
                {billings.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Nenhuma cobrança gerada ainda</p>
                    <Button onClick={() => setActiveTab('billings')} className="bg-blue-600 hover:bg-blue-700">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Criar primeira cobrança
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {billings.slice(0, 5).map((billing) => (
                      <div key={billing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{billing.clientName}</p>
                          <p className="text-sm text-gray-500">{billing.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            R$ {billing.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <Badge 
                            variant={
                              billing.status === 'paid' ? 'default' : 
                              billing.status === 'pending' ? 'secondary' :
                              billing.status === 'overdue' ? 'destructive' : 'outline'
                            }
                            className="text-xs"
                          >
                            {billing.status === 'paid' ? 'Paga' : 
                             billing.status === 'pending' ? 'Pendente' :
                             billing.status === 'overdue' ? 'Vencida' : 'Cancelada'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'clients' && (
          <ClientManager onDataChange={loadData} />
        )}

        {activeTab === 'billings' && (
          <BillingManager 
            clients={clients} 
            canCreate={canCreateBilling()}
            onDataChange={loadData}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
