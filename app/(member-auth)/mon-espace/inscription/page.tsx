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
import { memberSignUp, type MemberInscriptionState } from "./actions";

const initialState: MemberInscriptionState = {};

export default function MemberInscriptionPage() {
  const [state, formAction, pending] = useActionState(memberSignUp, initialState);

  if (state.checkEmail) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Vérifiez votre email</CardTitle>
          <CardDescription>
            Un email de confirmation vous a été envoyé. Cliquez sur le lien qu&apos;il
            contient pour activer votre compte, puis connectez-vous.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Activer mon espace membre</CardTitle>
        <CardDescription>
          Utilisez le même email que celui connu de votre église pour retrouver
          automatiquement votre fiche.
        </CardDescription>
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
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Création…" : "Créer mon compte"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/mon-espace/connexion" className="text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
