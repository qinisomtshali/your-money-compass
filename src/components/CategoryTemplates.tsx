import { useEffect, useState } from 'react';
import api, { type Category } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface TemplateCategory {
  name: string;
  icon: string;
  type: 'Income' | 'Expense';
  group: string;
}

interface TemplateGroup {
  group: string;
  categories: TemplateCategory[];
}

interface Pack {
  name: string;
  description: string;
  categories: string[];
}

type Packs = Record<string, Pack>;

const PACK_EMOJIS: Record<string, string> = {
  starter: '🚀',
  complete: '📦',
  freelancer: '💼',
  student: '🎓',
};

interface CategoryTemplatesProps {
  existingCategories: Category[];
  onApplied: () => void;
}

const CategoryTemplates = ({ existingCategories, onApplied }: CategoryTemplatesProps) => {
  const [groups, setGroups] = useState<TemplateGroup[]>([]);
  const [packs, setPacks] = useState<Packs>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [applyingPack, setApplyingPack] = useState<string | null>(null);
  const [applyingSelected, setApplyingSelected] = useState(false);

  const existingNames = new Set(existingCategories.map((c) => c.name));

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const [templatesRes, packsRes] = await Promise.all([
          api.get<TemplateGroup[]>('/api/categories/templates'),
          api.get<Packs>('/api/categories/templates/packs'),
        ]);
        setGroups(templatesRes.data);
        setPacks(packsRes.data);
      } catch {
        toast.error('Failed to load category templates');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const toggleCategory = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleApplyPack = async (packKey: string) => {
    setApplyingPack(packKey);
    try {
      const { data } = await api.post(`/api/categories/templates/apply-pack/${packKey}`);
      toast.success(`Added ${data.added} categories${data.skipped ? ` (${data.skipped} already existed)` : ''}`);
      onApplied();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to apply pack');
    } finally {
      setApplyingPack(null);
    }
  };

  const handleApplySelected = async () => {
    if (selected.size === 0) return;
    setApplyingSelected(true);
    try {
      const { data } = await api.post('/api/categories/templates/apply', {
        categories: Array.from(selected),
      });
      toast.success(`Added ${data.added} categories${data.skipped ? ` (${data.skipped} already existed)` : ''}`);
      setSelected(new Set());
      onApplied();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add categories');
    } finally {
      setApplyingSelected(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const packOrder = ['starter', 'complete', 'freelancer', 'student'];

  return (
    <div className="space-y-8">
      {/* Pack Selection */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Start Packs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packOrder.map((key) => {
            const pack = packs[key];
            if (!pack) return null;
            return (
              <Card key={key} className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="text-3xl mb-1">{PACK_EMOJIS[key]}</div>
                  <CardTitle className="text-base">{pack.name}</CardTitle>
                  <CardDescription>{pack.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={applyingPack === key}
                    onClick={() => handleApplyPack(key)}
                  >
                    {applyingPack === key && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Apply Pack
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Browse Individual Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Browse Categories</h2>
          {selected.size > 0 && (
            <Button size="sm" disabled={applyingSelected} onClick={handleApplySelected}>
              {applyingSelected && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Add Selected ({selected.size})
            </Button>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card">
          <Accordion type="multiple" className="w-full">
            {groups.map((group) => (
              <AccordionItem key={group.group} value={group.group}>
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{group.group}</span>
                    <Badge variant="secondary" className="text-xs">
                      {group.categories.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.categories.map((cat) => {
                      const alreadyExists = existingNames.has(cat.name);
                      return (
                        <label
                          key={cat.name}
                          className={`flex items-center gap-3 rounded-lg border border-border p-3 transition-colors ${
                            alreadyExists
                              ? 'opacity-50 cursor-not-allowed bg-muted/30'
                              : selected.has(cat.name)
                              ? 'bg-primary/5 border-primary/30'
                              : 'hover:bg-secondary/50 cursor-pointer'
                          }`}
                        >
                          <Checkbox
                            checked={selected.has(cat.name) || alreadyExists}
                            disabled={alreadyExists}
                            onCheckedChange={() => toggleCategory(cat.name)}
                          />
                          <span className="text-xl">{cat.icon}</span>
                          <span className="flex-1 text-sm font-medium text-foreground truncate">
                            {cat.name}
                          </span>
                          <Badge
                            variant={cat.type === 'Income' ? 'default' : 'destructive'}
                            className={`text-xs ${
                              cat.type === 'Income'
                                ? 'bg-green-500/15 text-green-600 border-green-500/20 hover:bg-green-500/15'
                                : 'bg-red-500/15 text-red-600 border-red-500/20 hover:bg-red-500/15'
                            }`}
                          >
                            {cat.type}
                          </Badge>
                        </label>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {selected.size > 0 && (
          <div className="flex justify-end mt-4">
            <Button disabled={applyingSelected} onClick={handleApplySelected}>
              {applyingSelected && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Add Selected ({selected.size})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryTemplates;
