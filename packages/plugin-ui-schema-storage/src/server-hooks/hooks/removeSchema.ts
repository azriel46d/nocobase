import { hookFactory } from './factory';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';

export async function removeSchema({ schemaInstance, options, db, params }) {
  const { transaction } = options;
  const uiSchemaRepository: UiSchemaRepository = db.getRepository('ui_schemas');
  const uid = schemaInstance.get('uid') as string;

  if (params?.removeEmptyParents) {
    await uiSchemaRepository.removeEmptyParents({
      uid,
      breakComponent: params['breakComponent'],
      transaction,
    });
  } else {
    await uiSchemaRepository.remove(uid);
  }
}