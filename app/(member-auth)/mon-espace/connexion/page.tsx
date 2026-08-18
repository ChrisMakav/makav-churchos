"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { memberSignIn, type MemberConnexionState } from "./actions";

const initialState: MemberConnexionState = {};

export default function MemberConnexionPage() {
  const [state, formAction, pending] = useActionState(memberSignIn, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Se connecter</CardTitle>
        <CardDescription>Accédez à votre espace membre.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Connexion…" : "Se connecter"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link href="/mon-espace/inscription" className="text-primary hover:underline">
              Activer mon espace membre
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
