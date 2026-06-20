npm run typecheck

> my-v0-project@0.1.0 typecheck
> tsc --noEmit -p tsconfig.app.json

app/api/test-admin/route.ts:2:35 - error TS2307: Cannot find module '@/lib/supabase-admin' or its corresponding type declarations.

2 import { createAdminClient } from '@/lib/supabase-admin'
                                    ~~~~~~~~~~~~~~~~~~~~~~

app/api/test-admin/route.ts:3:21 - error TS2307: Cannot find module '@/lib/logger' or its corresponding type declarations.

3 import { log } from '@/lib/logger'
                      ~~~~~~~~~~~~~~

app/api/test-admin/route.ts:4:30 - error TS2307: Cannot find module '@/lib/rate-limit' or its corresponding type declarations.

4 import { rateLimiters } from '@/lib/rate-limit'
                               ~~~~~~~~~~~~~~~~~~

app/api/users/[id]/route.ts:5:35 - error TS2307: Cannot find module '@/lib/supabase-admin' or its corresponding type declarations.

5 import { createAdminClient } from '@/lib/supabase-admin'
                                    ~~~~~~~~~~~~~~~~~~~~~~

app/api/users/route.ts:3:21 - error TS2307: Cannot find module '@/lib/logger' or its corresponding type declarations.

3 import { log } from '@/lib/logger'
                      ~~~~~~~~~~~~~~

app/api/users/route.ts:4:30 - error TS2307: Cannot find module '@/lib/rate-limit' or its corresponding type declarations.

4 import { rateLimiters } from '@/lib/rate-limit'
                               ~~~~~~~~~~~~~~~~~~

app/api/users/route.ts:10:35 - error TS2307: Cannot find module '@/lib/supabase-admin' or its corresponding type declarations.

10 import { createAdminClient } from '@/lib/supabase-admin'
                                     ~~~~~~~~~~~~~~~~~~~~~~

app/api/users/route.ts:11:30 - error TS2307: Cannot find module '@/lib/types/user' or its corresponding type declarations.

11 import type { AppUser } from '@/lib/types/user'
                                ~~~~~~~~~~~~~~~~~~

app/api/users/route.ts:72:31 - error TS7006: Parameter 'u' implicitly has an 'any' type.

72     const ids = authUsers.map(u => u.id)
                                 ~

app/api/users/route.ts:91:45 - error TS7006: Parameter 'u' implicitly has an 'any' type.

91     const result: AppUser[] = authUsers.map(u => {
                                               ~

app/auth/callback/route.ts:4:31 - error TS2307: Cannot find module '@/lib/database.types' or its corresponding type declarations.

4 import type { Database } from '@/lib/database.types';
                                ~~~~~~~~~~~~~~~~~~~~~~

app/client-layout.tsx:4:44 - error TS2307: Cannot find module '@/lib/supabase/init' or its corresponding type declarations.

4 import { initializeSupabaseServices } from '@/lib/supabase/init';
                                             ~~~~~~~~~~~~~~~~~~~~~

app/client-layout.tsx:5:25 - error TS2307: Cannot find module '@/components/ui/toaster' or its corresponding type declarations.

5 import { Toaster } from '@/components/ui/toaster';
                          ~~~~~~~~~~~~~~~~~~~~~~~~~

app/client-layout.tsx:6:31 - error TS2307: Cannot find module '@/components/ErrorBoundary' or its corresponding type declarations.

6 import { ErrorBoundary } from '@/components/ErrorBoundary';
                                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/debug-supabase/page.tsx:4:26 - error TS2307: Cannot find module '@/lib/supabase/client' or its corresponding type declarations.

4 import { supabase } from '@/lib/supabase/client';
                           ~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.backup.20250831141629.tsx:5:25 - error TS2307: Cannot find module '@/components/auth/enhanced-auth-context' or its corresponding type declarations.

5 import { useAuth } from "@/components/auth/enhanced-auth-context"
                          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.backup.20250831141629.tsx:6:89 - error TS2307: Cannot find module '@/lib/quotation-db' or its corresponding type declarations.

6 import { QuotationDB, type QuotationItem, type SavedQuotation, type IQuotationDB } from "@/lib/quotation-db"
                                                                                  
        ~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.backup.20250831141629.tsx:7:24 - error TS2307: Cannot find module '@/components/ui/button' or its corresponding type declarations.     

7 import { Button } from "@/components/ui/button"
                         ~~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.backup.20250831141629.tsx:8:23 - error TS2307: Cannot find module '@/components/ui/input' or its corresponding type declarations.      

8 import { Input } from "@/components/ui/input"
                        ~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.backup.20250831141629.tsx:9:75 - error TS2307: Cannot find module '@/components/ui/card' or its corresponding type declarations.       

9 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
                                                                            ~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.backup.20250831141629.tsx:10:23 - error TS2307: Cannot find module '@/components/ui/badge' or its corresponding type declarations.     

10 import { Badge } from "@/components/ui/badge"
                         ~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.backup.20250831141629.tsx:13:26 - error TS2307: Cannot find module '@/components/ui/use-toast' or its corresponding type declarations. 

13 import { useToast } from "@/components/ui/use-toast"
                            ~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.backup.20250831141629.tsx:23:8 - error TS2307: Cannot find module '@/components/ui/alert-dialog' or its corresponding type declarations.

23 } from "@/components/ui/alert-dialog"
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.backup.20250831141629.tsx:24:53 - error TS2307: Cannot find module '@/components/ui/alert' or its corresponding type declarations.     

24 import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"    
                                                       ~~~~~~~~~~~~~~~~~~~~~~~    

app/existing-quotations/page.backup.20250831141629.tsx:25:34 - error TS2307: Cannot find module '@/components/quotation-preview' or its corresponding type declarations.

25 import { QuotationPreview } from "@/components/quotation-preview"
                                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.backup.20250831141629.tsx:26:36 - error TS2307: Cannot find module '@/components/loading-slip-preview' or its corresponding type declarations.

26 import { LoadingSlipPreview } from "@/components/loading-slip-preview"
                                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.backup.20250831141629.tsx:27:37 - error TS2307: Cannot find module '@/components/pos-quotation-preview' or its corresponding type declarations.

27 import { POSQuotationPreview } from "@/components/pos-quotation-preview"       
                                       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~       

app/existing-quotations/page.backup.20250831141629.tsx:28:39 - error TS2307: Cannot find module '@/components/pos-loading-slip-preview' or its corresponding type declarations.

28 import { POSLoadingSlipPreview } from "@/components/pos-loading-slip-preview"  
                                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  

app/existing-quotations/page.backup.20250831141629.tsx:30:71 - error TS2307: Cannot find module '@/components/ui/dialog' or its corresponding type declarations.    

30 import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
                                                                         ~~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.backup.20250831141629.tsx:346:14 - error TS7006: Parameter 'q' implicitly has an 'any' type.

346         .map(q => formatQuotation(q as unknown as DatabaseQuotation))
                 ~

app/existing-quotations/page.backup.20250831141629.tsx:347:18 - error TS7006: Parameter 'q' implicitly has an 'any' type.

347         .filter((q): q is FormattedQuotation => q !== null);
                     ~

app/existing-quotations/page.backup.20250831141629.tsx:642:44 - error TS7006: Parameter 'item' implicitly has an 'any' type.

642         const filteredItems = items.filter(item => item.description !== 'Item details not available');
                                               ~~~~

app/existing-quotations/page.backup.20250831141629.tsx:733:28 - error TS7006: Parameter 'e' implicitly has an 'any' type.

733                 onChange={(e) => setSearchTerm(e.target.value)}
                               ~

app/existing-quotations/page.tsx:9:25 - error TS2307: Cannot find module '@/components/auth/enhanced-auth-context' or its corresponding type declarations.

9 import { useAuth } from "@/components/auth/enhanced-auth-context"
                          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.tsx:10:89 - error TS2307: Cannot find module '@/lib/quotation-db' or its corresponding type declarations.

10 import { QuotationDB, type QuotationItem, type SavedQuotation, type IQuotationDB } from "@/lib/quotation-db"
                                                                                  
         ~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.tsx:11:26 - error TS2307: Cannot find module '@/lib/supabase/client' or its corresponding type declarations.

11 import { supabase } from "@/lib/supabase/client"
                            ~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.tsx:12:24 - error TS2307: Cannot find module '@/components/ui/button' or its corresponding type declarations.

12 import { Button } from "@/components/ui/button"
                          ~~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.tsx:13:23 - error TS2307: Cannot find module '@/components/ui/input' or its corresponding type declarations.

13 import { Input } from "@/components/ui/input"
                         ~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.tsx:14:75 - error TS2307: Cannot find module '@/components/ui/card' or its corresponding type declarations.

14 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
                                                                             ~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.tsx:15:23 - error TS2307: Cannot find module '@/components/ui/badge' or its corresponding type declarations.

15 import { Badge } from "@/components/ui/badge"
                         ~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.tsx:18:26 - error TS2307: Cannot find module '@/components/ui/use-toast' or its corresponding type declarations.

18 import { useToast } from "@/components/ui/use-toast"
                            ~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.tsx:28:8 - error TS2307: Cannot find module '@/components/ui/alert-dialog' or its corresponding type declarations.

28 } from "@/components/ui/alert-dialog"
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.tsx:29:53 - error TS2307: Cannot find module '@/components/ui/alert' or its corresponding type declarations.

29 import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"    
                                                       ~~~~~~~~~~~~~~~~~~~~~~~    

app/existing-quotations/page.tsx:30:34 - error TS2307: Cannot find module '@/components/quotation-preview' or its corresponding type declarations.

30 import { QuotationPreview } from "@/components/quotation-preview"
                                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.tsx:31:36 - error TS2307: Cannot find module '@/components/loading-slip-preview' or its corresponding type declarations.

31 import { LoadingSlipPreview } from "@/components/loading-slip-preview"
                                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.tsx:32:37 - error TS2307: Cannot find module '@/components/pos-quotation-preview' or its corresponding type declarations.

32 import { POSQuotationPreview } from "@/components/pos-quotation-preview"       
                                       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~       

app/existing-quotations/page.tsx:33:39 - error TS2307: Cannot find module '@/components/pos-loading-slip-preview' or its corresponding type declarations.

33 import { POSLoadingSlipPreview } from "@/components/pos-loading-slip-preview"  
                                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  

app/existing-quotations/page.tsx:35:71 - error TS2307: Cannot find module '@/components/ui/dialog' or its corresponding type declarations.

35 import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
                                                                         ~~~~~~~~~~~~~~~~~~~~~~~~

app/existing-quotations/page.tsx:425:14 - error TS7006: Parameter 'q' implicitly has an 'any' type.

425         .map(q => formatQuotation(q as unknown as DatabaseQuotation))
                 ~

app/existing-quotations/page.tsx:426:18 - error TS7006: Parameter 'q' implicitly has an 'any' type.

426         .filter((q): q is FormattedQuotation => q !== null);
                     ~

app/existing-quotations/page.tsx:812:44 - error TS7006: Parameter 'item' implicitly has an 'any' type.

812         const filteredItems = items.filter(item => item.description !== 'Item details not available');
                                               ~~~~

app/existing-quotations/page.tsx:997:28 - error TS7006: Parameter 'e' implicitly has an 'any' type.

997                 onChange={(e) => setSearchTerm(e.target.value)}
                               ~

app/forgot-password/page.tsx:5:25 - error TS2307: Cannot find module '@/hooks/use-enhanced-auth' or its corresponding type declarations.

5 import { useAuth } from '@/hooks/use-enhanced-auth';
                          ~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/landing/page.tsx:8:24 - error TS2307: Cannot find module '@/components/ui/button' or its corresponding type declarations.

8 import { Button } from '@/components/ui/button';
                         ~~~~~~~~~~~~~~~~~~~~~~~~

app/landing/page.tsx:9:25 - error TS2307: Cannot find module '@/hooks/use-enhanced-auth' or its corresponding type declarations.

9 import { useAuth } from '@/hooks/use-enhanced-auth';
                          ~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/landing/page.tsx:10:29 - error TS2307: Cannot find module '@/components/user-profile' or its corresponding type declarations.

10 import { UserProfile } from '@/components/user-profile';
                               ~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/landing/page.tsx:11:75 - error TS2307: Cannot find module '@/components/ui/card' or its corresponding type declarations.

11 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
                                                                             ~~~~~~~~~~~~~~~~~~~~~~

app/landing/page.tsx:14:26 - error TS2307: Cannot find module '@/lib/supabase/client' or its corresponding type declarations.

14 import { supabase } from '@/lib/supabase/client';
                            ~~~~~~~~~~~~~~~~~~~~~~~

app/layout.tsx:4:34 - error TS2307: Cannot find module '@/components/providers/supabase-provider' or its corresponding type declarations.

4 import { SupabaseProvider } from '@/components/providers/supabase-provider';    
                                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~     

app/layout.tsx:5:38 - error TS2307: Cannot find module '@/components/auth/enhanced-auth-context' or its corresponding type declarations.

5 import { EnhancedAuthProvider } from '@/components/auth/enhanced-auth-context'; 
                                       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  

app/login/LoginContent.tsx:5:25 - error TS2307: Cannot find module '@/components/auth/enhanced-auth-context' or its corresponding type declarations.

5 import { useAuth } from '@/components/auth/enhanced-auth-context';
                          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/login/LoginContent.tsx:6:26 - error TS2307: Cannot find module '@/lib/supabase/client' or its corresponding type declarations.

6 import { supabase } from '@/lib/supabase/client';
                           ~~~~~~~~~~~~~~~~~~~~~~~

app/login/LoginContent.tsx:8:23 - error TS2307: Cannot find module '@/components/ui/alert' or its corresponding type declarations.

8 import { Alert } from '@/components/ui/alert';
                        ~~~~~~~~~~~~~~~~~~~~~~~

app/login/LoginContent.tsx:10:24 - error TS2307: Cannot find module '@/components/ui/button' or its corresponding type declarations.

10 import { Button } from '@/components/ui/button';
                          ~~~~~~~~~~~~~~~~~~~~~~~~

app/login/LoginContent.tsx:11:23 - error TS2307: Cannot find module '@/components/ui/input' or its corresponding type declarations.

11 import { Input } from '@/components/ui/input';
                         ~~~~~~~~~~~~~~~~~~~~~~~

app/login/LoginContent.tsx:12:23 - error TS2307: Cannot find module '@/components/ui/label' or its corresponding type declarations.

12 import { Label } from '@/components/ui/label';
                         ~~~~~~~~~~~~~~~~~~~~~~~

app/login/LoginContent.tsx:15:49 - error TS2307: Cannot find module '@/types/auth-forms' or its corresponding type declarations.

15 import { loginSchema, type LoginFormData } from '@/types/auth-forms';
                                                   ~~~~~~~~~~~~~~~~~~~~

app/login/LoginContent.tsx:16:20 - error TS2307: Cannot find module '@/lib/utils' or its corresponding type declarations.

16 import { cn } from '@/lib/utils';
                      ~~~~~~~~~~~~~

app/new-quotation/page.tsx:10:23 - error TS2307: Cannot find module '@/components/ui/use-toast' or its corresponding type declarations.

10 import { toast } from "@/components/ui/use-toast"
                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/new-quotation/page.tsx:11:26 - error TS2307: Cannot find module '@/lib/supabase/client' or its corresponding type declarations.

11 import { supabase } from "@/lib/supabase/client"
                            ~~~~~~~~~~~~~~~~~~~~~~~

app/new-quotation/page.tsx:12:24 - error TS2307: Cannot find module '@/components/ui/button' or its corresponding type declarations.

12 import { Button } from "@/components/ui/button"
                          ~~~~~~~~~~~~~~~~~~~~~~~~

app/new-quotation/page.tsx:13:75 - error TS2307: Cannot find module '@/components/ui/card' or its corresponding type declarations.

13 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
                                                                             ~~~~~~~~~~~~~~~~~~~~~~

app/new-quotation/page.tsx:14:23 - error TS2307: Cannot find module '@/components/ui/input' or its corresponding type declarations.

14 import { Input } from "@/components/ui/input"
                         ~~~~~~~~~~~~~~~~~~~~~~~

app/new-quotation/page.tsx:16:23 - error TS2307: Cannot find module '@/components/ui/label' or its corresponding type declarations.

16 import { Label } from "@/components/ui/label"
                         ~~~~~~~~~~~~~~~~~~~~~~~

app/new-quotation/page.tsx:17:27 - error TS2307: Cannot find module '@/components/ui/item-input' or its corresponding type declarations.

17 import { ItemInput } from "@/components/ui/item-input"
                             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/new-quotation/page.tsx:18:34 - error TS2307: Cannot find module '@/components/quotation-preview' or its corresponding type declarations.

18 import { QuotationPreview } from "@/components/quotation-preview"
                                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/new-quotation/page.tsx:19:36 - error TS2307: Cannot find module '@/components/loading-slip-preview' or its corresponding type declarations.

19 import { LoadingSlipPreview } from "@/components/loading-slip-preview"
                                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/new-quotation/page.tsx:20:37 - error TS2307: Cannot find module '@/components/pos-quotation-preview' or its corresponding type declarations.

20 import { POSQuotationPreview } from "@/components/pos-quotation-preview"       
                                       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~       

app/new-quotation/page.tsx:21:39 - error TS2307: Cannot find module '@/components/pos-loading-slip-preview' or its corresponding type declarations.

21 import { POSLoadingSlipPreview } from "@/components/pos-loading-slip-preview"  
                                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  

app/new-quotation/page.tsx:22:37 - error TS2307: Cannot find module '@/components/quotation-items-table' or its corresponding type declarations.

22 import { QuotationItemsTable } from "@/components/quotation-items-table"       
                                       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~       

app/new-quotation/page.tsx:23:25 - error TS2307: Cannot find module '@/components/auth/enhanced-auth-context' or its corresponding type declarations.

23 import { useAuth } from "@/components/auth/enhanced-auth-context"
                           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/new-quotation/page.tsx:24:85 - error TS2307: Cannot find module '@/components/ui/dialog' or its corresponding type declarations.

24 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
                                                                                  
     ~~~~~~~~~~~~~~~~~~~~~~~~

app/new-quotation/page.tsx:25:43 - error TS2307: Cannot find module '@/lib/database.types' or its corresponding type declarations.

25 import type { TablesInsert, Tables } from "@/lib/database.types"
                                             ~~~~~~~~~~~~~~~~~~~~~~

app/new-quotation/page.tsx:1386:34 - error TS7006: Parameter 'e' implicitly has an 'any' type.

1386                       onChange={(e) => {
                                      ~

app/new-quotation/page.tsx:1426:34 - error TS7006: Parameter 'e' implicitly has an 'any' type.

1426                       onChange={(e) =>
                                      ~

app/new-quotation/page.tsx:1481:34 - error TS7006: Parameter 'e' implicitly has an 'any' type.

1481                       onChange={(e) => handleTermChange(index, e.target.value)}
                                      ~

app/providers.tsx:5:44 - error TS2307: Cannot find module '@/lib/supabase/init' or its corresponding type declarations.

5 import { initializeSupabaseServices } from '@/lib/supabase/init';
                                             ~~~~~~~~~~~~~~~~~~~~~

app/quick-load-slip/page.tsx:5:26 - error TS2307: Cannot find module '@/lib/supabase/client' or its corresponding type declarations.

5 import { supabase } from "@/lib/supabase/client";
                           ~~~~~~~~~~~~~~~~~~~~~~~

app/quick-load-slip/page.tsx:6:33 - error TS2307: Cannot find module '@/hooks/use-enhanced-auth' or its corresponding type declarations.

6 import { useEnhancedAuth } from "@/hooks/use-enhanced-auth";
                                  ~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/quick-load-slip/page.tsx:7:24 - error TS2307: Cannot find module '@/components/ui/button' or its corresponding type declarations.

7 import { Button } from "@/components/ui/button";
                         ~~~~~~~~~~~~~~~~~~~~~~~~

app/quick-load-slip/page.tsx:8:27 - error TS2307: Cannot find module '@/components/ui/item-input' or its corresponding type declarations.

8 import { ItemInput } from "@/components/ui/item-input";
                            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/quick-load-slip/page.tsx:9:23 - error TS2307: Cannot find module '@/hooks/use-toast' or its corresponding type declarations.

9 import { toast } from "@/hooks/use-toast";
                        ~~~~~~~~~~~~~~~~~~~

app/quick-load-slip/page.tsx:10:36 - error TS2307: Cannot find module '@/components/loading-slip-preview' or its corresponding type declarations.

10 import { LoadingSlipPreview } from "@/components/loading-slip-preview";        
                                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/quick-load-slip/page.tsx:11:39 - error TS2307: Cannot find module '@/components/pos-loading-slip-preview' or its corresponding type declarations.

11 import { POSLoadingSlipPreview } from "@/components/pos-loading-slip-preview"; 
                                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  

app/reset-password/page.tsx:3:26 - error TS2307: Cannot find module '@/components/ui/skeleton' or its corresponding type declarations.

3 import { Skeleton } from '@/components/ui/skeleton';
                           ~~~~~~~~~~~~~~~~~~~~~~~~~~

app/reset-password/ResetPasswordForm.tsx:5:25 - error TS2307: Cannot find module '@/hooks/use-enhanced-auth' or its corresponding type declarations.

5 import { useAuth } from '@/hooks/use-enhanced-auth';
                          ~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/settings/page.tsx:2:26 - error TS2307: Cannot find module '@/components/ui/skeleton' or its corresponding type declarations.

2 import { Skeleton } from "@/components/ui/skeleton"
                           ~~~~~~~~~~~~~~~~~~~~~~~~~~

app/settings/SettingsContent.tsx:3:24 - error TS2307: Cannot find module '@/components/ui/button' or its corresponding type declarations.

3 import { Button } from "@/components/ui/button"
                         ~~~~~~~~~~~~~~~~~~~~~~~~

app/settings/SettingsContent.tsx:6:32 - error TS2307: Cannot find module '@/components/settings/user-management' or its corresponding type declarations.

6 import { UserManagement } from "@/components/settings/user-management"
                                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/settings/SettingsContent.tsx:7:32 - error TS2307: Cannot find module '@/components/settings/product-catalog' or its corresponding type declarations.

7 import { ProductCatalog } from "@/components/settings/product-catalog"
                                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/settings/SettingsContent.tsx:8:30 - error TS2307: Cannot find module '@/components/settings/settings-tabs' or its corresponding type declarations.

8 import { SettingsTabs } from "@/components/settings/settings-tabs"
                               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/signup/page.tsx:3:28 - error TS2307: Cannot find module '@/components/auth/signup-form' or its corresponding type declarations.

3 import { SignupForm } from '@/components/auth/signup-form';
                             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/update-password/page.tsx:5:25 - error TS2307: Cannot find module '@/hooks/use-enhanced-auth' or its corresponding type declarations.

5 import { useAuth } from '@/hooks/use-enhanced-auth';
                          ~~~~~~~~~~~~~~~~~~~~~~~~~~~

app/update-password/page.tsx:6:26 - error TS2307: Cannot find module '@/lib/supabase/client' or its corresponding type declarations.

6 import { supabase } from '@/lib/supabase/client';
                           ~~~~~~~~~~~~~~~~~~~~~~~

app/update-password/page.tsx:8:24 - error TS2307: Cannot find module '@/components/ui/button' or its corresponding type declarations.

8 import { Button } from '@/components/ui/button';
                         ~~~~~~~~~~~~~~~~~~~~~~~~

app/update-password/page.tsx:9:23 - error TS2307: Cannot find module '@/components/ui/input' or its corresponding type declarations.

9 import { Input } from '@/components/ui/input';
                        ~~~~~~~~~~~~~~~~~~~~~~~

app/update-password/page.tsx:10:23 - error TS2307: Cannot find module '@/components/ui/label' or its corresponding type declarations.

10 import { Label } from '@/components/ui/label';
                         ~~~~~~~~~~~~~~~~~~~~~~~

app/update-password/page.tsx:11:53 - error TS2307: Cannot find module '@/components/ui/alert' or its corresponding type declarations.

11 import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';   
                                                       ~~~~~~~~~~~~~~~~~~~~~~~    

app/update-password/page.tsx:186:28 - error TS7006: Parameter 'e' implicitly has an 'any' type.

186                 onChange={(e) => setPassword(e.target.value)}
                               ~

app/update-password/page.tsx:202:28 - error TS7006: Parameter 'e' implicitly has an 'any' type.

202                 onChange={(e) => setConfirmPassword(e.target.value)}
                               ~

components/settings/product-catalog.tsx:3:26 - error TS2307: Cannot find module '@/components/ui/use-toast' or its corresponding type declarations.

3 import { useToast } from '@/components/ui/use-toast';
                           ~~~~~~~~~~~~~~~~~~~~~~~~~~~

components/settings/product-catalog.tsx:4:26 - error TS2307: Cannot find module '@/lib/supabase/client' or its corresponding type declarations.

4 import { supabase } from '@/lib/supabase/client';
                           ~~~~~~~~~~~~~~~~~~~~~~~

components/settings/product-catalog.tsx:5:24 - error TS2307: Cannot find module '@/components/ui/button' or its corresponding type declarations.

5 import { Button } from '@/components/ui/button';
                         ~~~~~~~~~~~~~~~~~~~~~~~~

components/settings/product-catalog.tsx:16:23 - error TS2307: Cannot find module '@/components/ui/input' or its corresponding type declarations.

16 import { Input } from '@/components/ui/input';
                         ~~~~~~~~~~~~~~~~~~~~~~~

components/settings/product-catalog.tsx:17:79 - error TS2307: Cannot find module '@/components/ui/table' or its corresponding type declarations.

17 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
                                                                                 ~~~~~~~~~~~~~~~~~~~~~~~

components/settings/product-catalog.tsx:18:24 - error TS2307: Cannot find module '@/components/ui/switch' or its corresponding type declarations.

18 import { Switch } from "@/components/ui/switch";
                          ~~~~~~~~~~~~~~~~~~~~~~~~

components/settings/product-catalog.tsx:20:99 - error TS2307: Cannot find module '@/components/ui/dialog' or its corresponding type declarations.

20 import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
                                                                                  
                   ~~~~~~~~~~~~~~~~~~~~~~~~

components/settings/product-catalog.tsx:21:35 - error TS2307: Cannot find module '@/components/ui/card' or its corresponding type declarations.

21 import { Card, CardContent } from "@/components/ui/card";
                                     ~~~~~~~~~~~~~~~~~~~~~~

components/settings/product-catalog.tsx:22:167 - error TS2307: Cannot find module '@/components/ui/alert-dialog' or its corresponding type declarations.

22 import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
                                                                                  
                                                                                  
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

components/settings/product-catalog.tsx:576:25 - error TS7006: Parameter 'e' implicitly has an 'any' type.

576             onKeyDown={(e) => handleKeyDown(e, product.id, field)}
                            ~

components/settings/product-catalog.tsx:944:35 - error TS7006: Parameter 'checked' implicitly has an 'any' type.

944                 onCheckedChange={(checked) =>
                                      ~~~~~~~

components/settings/ProductRow.tsx:2:24 - error TS2307: Cannot find module '@/components/ui/button' or its corresponding type declarations.

2 import { Button } from '@/components/ui/button';
                         ~~~~~~~~~~~~~~~~~~~~~~~~

components/settings/ProductRow.tsx:3:23 - error TS2307: Cannot find module '@/components/ui/input' or its corresponding type declarations.

3 import { Input } from '@/components/ui/input';
                        ~~~~~~~~~~~~~~~~~~~~~~~

components/settings/ProductRow.tsx:4:24 - error TS2307: Cannot find module '@/components/ui/switch' or its corresponding type declarations.

4 import { Switch } from '@/components/ui/switch';
                         ~~~~~~~~~~~~~~~~~~~~~~~~

components/settings/ProductRow.tsx:5:37 - error TS2307: Cannot find module '@/components/ui/table' or its corresponding type declarations.

5 import { TableRow, TableCell } from '@/components/ui/table';
                                      ~~~~~~~~~~~~~~~~~~~~~~~

components/settings/ProductRow.tsx:7:38 - error TS2307: Cannot find module '@/types/product' or its corresponding type declarations.

7 import { Product, ProductBase } from '@/types/product';
                                       ~~~~~~~~~~~~~~~~~

components/settings/ProductRow.tsx:54:33 - error TS7006: Parameter 'checked' implicitly has an 'any' type.

54               onCheckedChange={(checked) => onInputChange(field, checked)}     
                                   ~~~~~~~

components/settings/ProductRow.tsx:61:26 - error TS7006: Parameter 'e' implicitly has an 'any' type.

61               onChange={(e) => onInputChange(field, e.target.value)}
                            ~

components/settings/settings-tabs.tsx:1:20 - error TS2307: Cannot find module '@/lib/utils' or its corresponding type declarations.

1 import { cn } from "@/lib/utils"
                     ~~~~~~~~~~~~~

components/settings/user-management.tsx:2:24 - error TS2307: Cannot find module '@/components/ui/button' or its corresponding type declarations.

2 import { Button } from "@/components/ui/button"
                         ~~~~~~~~~~~~~~~~~~~~~~~~

components/settings/user-management.tsx:3:75 - error TS2307: Cannot find module '@/components/ui/card' or its corresponding type declarations.

3 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
                                                                            ~~~~~~~~~~~~~~~~~~~~~~

components/settings/user-management.tsx:4:79 - error TS2307: Cannot find module '@/components/ui/table' or its corresponding type declarations.

4 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
                                                                                ~~~~~~~~~~~~~~~~~~~~~~~

components/settings/user-management.tsx:6:23 - error TS2307: Cannot find module '@/components/ui/input' or its corresponding type declarations.

6 import { Input } from "@/components/ui/input"
                        ~~~~~~~~~~~~~~~~~~~~~~~

components/settings/user-management.tsx:7:24 - error TS2307: Cannot find module '@/components/ui/switch' or its corresponding type declarations.

7 import { Switch } from "@/components/ui/switch"
                         ~~~~~~~~~~~~~~~~~~~~~~~~

components/settings/user-management.tsx:8:99 - error TS2307: Cannot find module '@/components/ui/dialog' or its corresponding type declarations.

8 import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
                                                                                  
                  ~~~~~~~~~~~~~~~~~~~~~~~~

components/settings/user-management.tsx:13:71 - error TS2307: Cannot find module '@/lib/types/user' or its corresponding type declarations.

13 import type { AppUser, EditableUserField, EditState, UserInput } from "@/lib/types/user"
                                                                         ~~~~~~~~~~~~~~~~~~

components/settings/user-modal.tsx:2:24 - error TS2307: Cannot find module '@/components/ui/button' or its corresponding type declarations.

2 import { Button } from "@/components/ui/button"
                         ~~~~~~~~~~~~~~~~~~~~~~~~

components/settings/user-modal.tsx:10:8 - error TS2307: Cannot find module '@/components/ui/dialog' or its corresponding type declarations.

10 } from "@/components/ui/dialog"
          ~~~~~~~~~~~~~~~~~~~~~~~~

components/settings/user-modal.tsx:11:23 - error TS2307: Cannot find module '@/components/ui/input' or its corresponding type declarations.

11 import { Input } from "@/components/ui/input"
                         ~~~~~~~~~~~~~~~~~~~~~~~

components/settings/user-modal.tsx:12:23 - error TS2307: Cannot find module '@/components/ui/label' or its corresponding type declarations.

12 import { Label } from "@/components/ui/label"
                         ~~~~~~~~~~~~~~~~~~~~~~~

components/settings/user-modal.tsx:19:8 - error TS2307: Cannot find module '@/components/ui/select' or its corresponding type declarations.

19 } from "@/components/ui/select"
          ~~~~~~~~~~~~~~~~~~~~~~~~

components/settings/user-modal.tsx:20:24 - error TS2307: Cannot find module '@/components/ui/switch' or its corresponding type declarations.

20 import { Switch } from "@/components/ui/switch"
                          ~~~~~~~~~~~~~~~~~~~~~~~~

components/settings/user-modal.tsx:22:42 - error TS2307: Cannot find module '@/lib/types/user' or its corresponding type declarations.

22 import type { UserInput, UserRole } from "@/lib/types/user"
                                            ~~~~~~~~~~~~~~~~~~

components/settings/user-modal.tsx:78:17 - error TS7006: Parameter 'prev' implicitly has an 'any' type.

78     setFormData(prev => ({
                   ~~~~

components/settings/user-modal.tsx:92:17 - error TS7006: Parameter 'prev' implicitly has an 'any' type.

92     setFormData(prev => ({
                   ~~~~

components/settings/user-modal.tsx:261:35 - error TS7006: Parameter 'value' implicitly has an 'any' type.

261                   onValueChange={(value) => handleSelectChange('role', value as UserRole)}
                                      ~~~~~

components/settings/user-modal.tsx:284:37 - error TS7006: Parameter 'checked' implicitly has an 'any' type.

284                   onCheckedChange={(checked) =>
                                        ~~~~~~~

components/ui/toast.tsx:8:20 - error TS2307: Cannot find module '@/lib/utils' or its corresponding type declarations.

8 import { cn } from "@/lib/utils"
                     ~~~~~~~~~~~~~

hooks/use-enhanced-auth.ts:5:44 - error TS2307: Cannot find module '@/components/auth/enhanced-auth-context' or its corresponding type declarations.

5 import { useAuth as useEnhancedAuth } from '@/components/auth/enhanced-auth-context';
                                             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

hooks/use-enhanced-auth.ts:6:28 - error TS2307: Cannot find module '@/types/auth' or its corresponding type declarations.

6 import { AppSession } from '@/types/auth';
                             ~~~~~~~~~~~~~~

hooks/use-enhanced-auth.ts:7:26 - error TS2307: Cannot find module '@/lib/supabase/client' or its corresponding type declarations.

7 import { supabase } from '@/lib/supabase/client';
                           ~~~~~~~~~~~~~~~~~~~~~~~


Found 151 errors in 28 files.

Errors  Files
     3  app/api/test-admin/route.ts:2
     1  app/api/users/[id]/route.ts:5
     6  app/api/users/route.ts:3
     1  app/auth/callback/route.ts:4
     3  app/client-layout.tsx:4
     1  app/debug-supabase/page.tsx:4
    18  app/existing-quotations/page.backup.20250831141629.tsx:5
    19  app/existing-quotations/page.tsx:9
     1  app/forgot-password/page.tsx:5
     5  app/landing/page.tsx:8
     2  app/layout.tsx:4
     8  app/login/LoginContent.tsx:5
    18  app/new-quotation/page.tsx:10
     1  app/providers.tsx:5
     7  app/quick-load-slip/page.tsx:5
     1  app/reset-password/page.tsx:3
     1  app/reset-password/ResetPasswordForm.tsx:5
     1  app/settings/page.tsx:2
     4  app/settings/SettingsContent.tsx:3
     1  app/signup/page.tsx:3
     8  app/update-password/page.tsx:5
    11  components/settings/product-catalog.tsx:3
     7  components/settings/ProductRow.tsx:2
     1  components/settings/settings-tabs.tsx:1
     7  components/settings/user-management.tsx:2
    11  components/settings/user-modal.tsx:2
     1  components/ui/toast.tsx:8
     3  hooks/use-enhanced-auth.ts:5
PS D:\Mine\BusinessOfficial\PopularSteels\PSQuoteApp_Revised\PSQuote_V2> 