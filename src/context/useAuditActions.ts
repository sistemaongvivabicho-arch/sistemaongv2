import { useCallback } from 'react';
import { useAnimalContext } from './AnimalContext';
import { useAudit } from './AuditContext';
import { AuditActionType } from '../types/audit';
import { Animal, LOCATION_LABELS, SPECIES_LABELS, SEX_LABELS } from '../types/animal';

function locationLabel(loc: string): string {
  return LOCATION_LABELS[loc as keyof typeof LOCATION_LABELS]?.label || loc;
}

function speciesLabel(sp: string): string {
  return SPECIES_LABELS[sp as keyof typeof SPECIES_LABELS] || sp;
}

function sexLabel(sx: string): string {
  return SEX_LABELS[sx as keyof typeof SEX_LABELS] || sx;
}

export function useAuditActions() {
  const ctx = useAnimalContext();
  const { addAuditLog } = useAudit();

  const addAnimal = useCallback(
    async (animalData: Omit<Animal, 'id' | 'history' | 'status'>) => {
      const result = await ctx.addAnimal(animalData);
      if (result) {
        await addAuditLog(
          'cadastro_animal',
          `Animal "${animalData.name}" foi cadastrado no sistema. Espécie: ${speciesLabel(animalData.species)}, Sexo: ${sexLabel(animalData.sex)}.`,
          result,
          animalData.name,
          `Localização inicial: Triagem`
        );
      }
      return result;
    },
    [ctx, addAuditLog]
  );

  const updateAnimal = useCallback(
    async (id: string, updatedData: Partial<Animal>) => {
      const current = ctx.getAnimalById(id);
      if (!current) return false;

      const result = await ctx.updateAnimal(id, updatedData);
      if (!result) return false;

      const changes: string[] = [];

      if (updatedData.name && updatedData.name !== current.name) {
        changes.push(`Nome: "${current.name}" → "${updatedData.name}"`);
      }
      if (updatedData.species && updatedData.species !== current.species) {
        await addAuditLog(
          'alteracao_especie',
          `${current.name}: espécie alterada de ${speciesLabel(current.species)} para ${speciesLabel(updatedData.species)}.`,
          id,
          updatedData.name || current.name
        );
      }
      if (updatedData.sex && updatedData.sex !== current.sex) {
        await addAuditLog(
          'alteracao_sexo',
          `${current.name}: sexo alterado de ${sexLabel(current.sex)} para ${sexLabel(updatedData.sex)}.`,
          id,
          updatedData.name || current.name
        );
      }
      if (updatedData.currentLocation && updatedData.currentLocation !== current.currentLocation) {
        await addAuditLog(
          'alteracao_localizacao',
          `${current.name} movido(a) de ${locationLabel(current.currentLocation)} para ${locationLabel(updatedData.currentLocation)}.`,
          id,
          updatedData.name || current.name
        );
      }
      if (updatedData.vaccinationDate !== undefined && updatedData.vaccinationDate !== current.vaccinationDate) {
        await addAuditLog(
          'alteracao_vacinacao',
          `${current.name}: data de vacinação atualizada para ${updatedData.vaccinationDate || 'removida'}.`,
          id,
          updatedData.name || current.name
        );
      }
      if (updatedData.vaccinationDueDate !== undefined && updatedData.vaccinationDueDate !== current.vaccinationDueDate) {
        await addAuditLog(
          'alteracao_vacinacao',
          `${current.name}: data de próxima vacina atualizada para ${updatedData.vaccinationDueDate || 'removida'}.`,
          id,
          updatedData.name || current.name
        );
      }
      if (updatedData.castrationScheduledDate !== undefined && updatedData.castrationScheduledDate !== current.castrationScheduledDate) {
        if (updatedData.castrationScheduledDate && !current.castrationScheduledDate) {
          await addAuditLog(
            'agendamento_castracao',
            `${current.name}: castração agendada para ${updatedData.castrationScheduledDate}.`,
            id,
            updatedData.name || current.name
          );
        } else if (!updatedData.castrationScheduledDate && current.castrationScheduledDate) {
          await addAuditLog(
            'exclusao_agendamento',
            `${current.name}: agendamento de castração (era ${current.castrationScheduledDate}) foi removido.`,
            id,
            updatedData.name || current.name
          );
        } else {
          await addAuditLog(
            'alteracao_agendamento',
            `${current.name}: agendamento de castração alterado de ${current.castrationScheduledDate} para ${updatedData.castrationScheduledDate}.`,
            id,
            updatedData.name || current.name
          );
        }
      }
      if (updatedData.castrationDate !== undefined && updatedData.castrationDate !== current.castrationDate) {
        await addAuditLog(
          'alteracao_cadastro',
          `${current.name}: data de castração atualizada para ${updatedData.castrationDate || 'removida'}.`,
          id,
          updatedData.name || current.name
        );
      }

      if (changes.length > 0) {
        await addAuditLog(
          'alteracao_cadastro',
          `${current.name}: ${changes.join(', ')}.`,
          id,
          updatedData.name || current.name
        );
      }

      return true;
    },
    [ctx, addAuditLog]
  );

  const changeLocation = useCallback(
    async (id: string, newLocation: string, observation?: string) => {
      const current = ctx.getAnimalById(id);
      if (!current) return false;

      const result = await ctx.changeLocation(id, newLocation as any, observation);
      if (result) {
        const oldLoc = locationLabel(current.currentLocation);
        const newLoc = locationLabel(newLocation);
        await addAuditLog(
          current.currentLocation === 'triagem' && newLocation !== 'triagem'
            ? 'saida_triagem'
            : newLocation === 'triagem' && current.currentLocation !== 'triagem'
              ? 'entrada_triagem'
              : 'alteracao_localizacao',
          `${current.name} movido(a) de ${oldLoc} para ${newLoc}.${observation ? ` Obs: ${observation}` : ''}`,
          id,
          current.name
        );
      }
      return result;
    },
    [ctx, addAuditLog]
  );

  const registerAdoption = useCallback(
    async (id: string, details: { adoptionDate: string; adopterName: string; adopterContact: string; adopterAddress?: string; notes?: string }) => {
      const current = ctx.getAnimalById(id);
      if (!current) return false;

      const result = await ctx.registerAdoption(id, details);
      if (result) {
        await addAuditLog(
          'adocao',
          `${current.name} foi adotado(a) por ${details.adopterName} em ${details.adoptionDate}.`,
          id,
          current.name
        );
      }
      return result;
    },
    [ctx, addAuditLog]
  );

  const registerDeath = useCallback(
    async (id: string, details: { deathDate: string; notes?: string }) => {
      const current = ctx.getAnimalById(id);
      if (!current) return false;

      const result = await ctx.registerDeath(id, details);
      if (result) {
        await addAuditLog(
          'registro_obito',
          `Óbito de ${current.name} registrado em ${details.deathDate}.${details.notes ? ` Obs: ${details.notes}` : ''}`,
          id,
          current.name
        );
      }
      return result;
    },
    [ctx, addAuditLog]
  );

  const deleteAnimal = useCallback(
    async (id: string) => {
      const current = ctx.getAnimalById(id);
      if (!current) return false;

      const result = await ctx.deleteAnimal(id);
      if (result) {
        await addAuditLog(
          'exclusao_animal',
          `Animal "${current.name}" foi excluído do sistema.`,
          id,
          current.name
        );
      }
      return result;
    },
    [ctx, addAuditLog]
  );

  const uploadAnimalPhoto = useCallback(
    async (id: string, file: File) => {
      const current = ctx.getAnimalById(id);
      if (!current) return null;

      const hadPhoto = !!current.photoUrl;
      const result = await ctx.uploadAnimalPhoto(id, file);
      if (result) {
        await addAuditLog(
          hadPhoto ? 'troca_foto' : 'upload_foto',
          `${current.name}: ${hadPhoto ? 'foto substituída' : 'foto adicionada'}. Arquivo: ${file.name}.`,
          id,
          current.name
        );
      }
      return result;
    },
    [ctx, addAuditLog]
  );

  const deleteAnimalPhoto = useCallback(
    async (id: string) => {
      const current = ctx.getAnimalById(id);
      if (!current) return false;

      const result = await ctx.deleteAnimalPhoto(id);
      if (result) {
        await addAuditLog(
          'exclusao_animal',
          `${current.name}: foto removida da ficha.`,
          id,
          current.name
        );
      }
      return result;
    },
    [ctx, addAuditLog]
  );

  return {
    ...ctx,
    addAnimal,
    updateAnimal,
    changeLocation,
    registerAdoption,
    registerDeath,
    deleteAnimal,
    uploadAnimalPhoto,
    deleteAnimalPhoto
  };
}
